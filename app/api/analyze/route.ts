import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientDetails, emergencyDescription, language } = body;

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

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let jsonResponse = response.text || '';
    
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

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to analyze emergency.', error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
