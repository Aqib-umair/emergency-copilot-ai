import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientDetails, emergencyDescription, language, caseId } = body;

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("Gemini Status:", response.status);
      console.error("Gemini Response:", errorBody);

      return NextResponse.json(
        {
          success: false,
          status: response.status,
          gemini: errorBody
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    let jsonResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // In case there are markdown tags despite the prompt and mimeType
    if (jsonResponse.startsWith('```json')) {
      jsonResponse = jsonResponse.replace(/```json\n/, '').replace(/\n```$/, '');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid AI response', error: 'Could not parse JSON from AI' },
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
        console.log("Inserting payload into emergency_reports:", payload);

        const { error: insertError } = await supabase
          .from('emergency_reports')
          .insert([payload]);
          
        if (insertError) {
          console.error("Supabase Insert Error (emergency_reports):", JSON.stringify(insertError, null, 2));
          console.error("Error message:", insertError?.message);
          console.error("Error details:", insertError?.details);
          console.error("Error hint:", insertError?.hint);
          console.error("Error code:", insertError?.code);
        } else {
          console.log('Successfully inserted emergency_reports row.');
        }
      } catch (err: any) {
        console.error('Unexpected error inserting into emergency_reports:', err?.message || err);
      }
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze emergency.', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
