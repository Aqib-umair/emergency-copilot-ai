import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientDetails, emergencyDescription, language, caseId } = body;

    // Validate OpenRouter API Key
    const rawKey = process.env.OPENROUTER_API_KEY || '';
    // Aggressively sanitize in case Vercel env variable has concatenated strings
    const openRouterKey = rawKey.split('\n')[0].trim().replace(/^"|"$/g, '');

    if (!openRouterKey) {
      console.error("OpenRouter API key is not configured.");
      return NextResponse.json(
        { success: false, message: 'OpenRouter API key is not configured.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterKey,
    });

    const prompt = `
      You are an AI Emergency Assistant. Your role is to analyze the emergency description and provide guidance.
      IMPORTANT: This does not replace doctors or emergency services.
      
      Patient Profile:
      - Name: ${patientDetails?.name || 'Unknown'}
      - Age: ${patientDetails?.age || 'Unknown'}
      - Gender: ${patientDetails?.gender || 'Unknown'}
      - Weight: ${patientDetails?.weight || 'Unknown'}
      - Blood Group: ${patientDetails?.bloodGroup || 'Unknown'}
      - Medical Conditions: ${patientDetails?.medicalConditions || 'None'}
      - Medications: ${patientDetails?.medications || 'None'}
      - Allergies: ${patientDetails?.allergies || 'None'}

      Emergency Description:
      "${emergencyDescription}"

      Language Requested: ${language || 'en'}

      Provide a structured JSON output with EXACTLY these keys:
      {
        "urgencyLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        "confidenceScore": (number between 0-100),
        "generalGuidance": "Detailed first-aid guidance in paragraphs",
        "simpleExplanation": "A very simple, calm explanation of what might be happening",
        "nextSteps": ["step 1", "step 2", "step 3"],
        "timeline": [
          { "time": "Immediate", "action": "action description" },
          { "time": "Within 10 mins", "action": "action description" }
        ],
        "medicalSummary": "A concise, doctor-ready summary of the situation",
        "disclaimer": "This is general informational guidance and not a medical diagnosis. If symptoms indicate a possible life-threatening emergency, contact emergency services immediately."
      }
      
      Respond ONLY with the JSON object. Do not include markdown code blocks. Ensure all text is translated to the requested language (except JSON keys and urgencyLevel values which must remain as specified).
    `;

    console.log("OpenRouter API request started using model: qwen/qwen3-32b");

    const completion = await openai.chat.completions.create({
      model: "qwen/qwen3-32b",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const rawText = completion.choices[0]?.message?.content || '';
    console.log("Raw OpenRouter Response text:", rawText);

    let jsonResponse = rawText.trim();
    
    // Attempt to extract JSON from markdown or raw text
    const match = jsonResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      jsonResponse = match[1].trim();
    } else {
      // Fallback: manually find first '{' and last '}'
      const firstBrace = jsonResponse.indexOf('{');
      const lastBrace = jsonResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonResponse = jsonResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonResponse);
    } catch (parseError: any) {
      console.error('Failed to parse OpenRouter JSON:', parseError);
      console.error('Attempted to parse string:', jsonResponse);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid AI response', 
          error: parseError?.message || 'Could not parse JSON from AI',
          rawResponse: rawText
        },
        { status: 500 }
      );
    }

    if (caseId) {
      try {
        const payload = {
          patient_case_id: caseId,
          urgency_level: parsedData.urgencyLevel,
          confidence_score: parsedData.confidenceScore || null
        };

        const { error: insertError } = await supabase
          .from('emergency_reports')
          .insert([payload]);
          
        if (insertError) {
          console.error("Supabase Insert Error:", JSON.stringify(insertError, null, 2));
        }
      } catch (err: any) {
        console.error('Unexpected error inserting into emergency_reports:', err?.message || err);
      }
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Unexpected Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze emergency.', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
