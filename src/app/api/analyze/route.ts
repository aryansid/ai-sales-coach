import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert sales coach specializing in restaurant partnerships and food delivery services. 
          You're analyzing a conversation between a DoorDash sales representative and a restaurant owner.
          
          Provide analysis in the following JSON structure:
          {
            "scores": [
              {
                "category": "Understanding & Personalization",
                "score": <number 0-100>,
                "description": "<specific and nuanced but concise feedback on how well the sales rep understood the restaurant's needs and personalized the offer>"
              },
              {
                "category": "Objection Handling & Trust",
                "score": <number 0-100>,
                "description": "<specific and nuanced but concise feedback on how well the sales rep handled objections and built trust>"
              },
              {
                "category": "Value Communication",
                "score": <number 0-100>,
                "description": "<specific and nuanced but concise feedback on how well the sales rep communicated the value of DoorDash's services>"
              }
            ],
            "insights": [
              {
                "message": "<actual quote from conversation>",
                "suggestion": "<specific, actionable improvement suggestion>"
              },
              // 2 more insights following same structure (so overall is strictly 3)
            ]
          }`
        },
        {
          role: "user",
          content: `Here's the transcript where the sales rep ('user') is trying to onboard a restaurant ('assisant') to DoorDash: ${transcript}`
        }
      ]
    });

    // Parse the response to ensure it matches our expected structure
    const analysis = JSON.parse(completion.choices[0].message.content);
    
    // Validate the structure
    if (!analysis.scores || !analysis.insights) {
      throw new Error('Invalid analysis structure received');
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    );
  }
}