import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { NextResponse } from 'next/server';

// Define our schema
const PersonaSchema = z.object({
  demographics: z.object({
    name: z.string().describe('Full name that reflects cultural heritage, family background, or generational naming patterns.'),
    age: z.number().describe('Specific age that influences life circumstances, career stage, and financial decisions.'),
    education: z.string().describe('Detailed educational background including field of study, incomplete degrees, or ongoing education.'),
    occupation: z.string().describe('Specific job title with industry context and career trajectory details.'),
    race: z.string().describe('Detailed ethnic and cultural background that shapes life experiences and perspectives.'),
    sex: z.string().describe('Gender identity and any relevant context about how it influences their life decisions.'),
    location_type: z.string().describe('Detailed description of living environment including specific region, community type, and local economic conditions.'),
    family_status: z.string().describe('Detailed family dynamics including relationship history, family structure, and living arrangements.'),

  }),
  financial_profile: z.object({
    income_profile: z.string().describe('Detailed financial assessment including income range, sources of income, job security, career progression, and household earnings potential.'),
    risk_appetite: z.string().describe('Specific risk tolerance with examples of past financial decisions and investment choices.'),
    financial_holdings: z.array(z.string()).describe('Comprehensive breakdown of financial position including assets (e.g., home value, investments, inheritance expectations) and liabilities (e.g., debts, loans, payment obligations).')
  }),
  experiences: z.object({
    core_values: z.array(z.string()).describe('Deep-rooted beliefs and principles that drive major life decisions, shaped by personal experiences."'),
    insurance_history: z.string().describe('Detailed narrative of insurance experiences including past interactions, claims history, trust level based on personal/family experiences, and how cultural factors shape their view of the industry.'),
    medical_background: z.string().describe('Comprehensive health profile including personal conditions, medications, lifestyle factors, preventive care habits, and detailed family medical history across generations with age of onset patterns.')
  }),
  summary: z.string().describe('A very concise summary of the persona. Limit to 3-4 words.')
});

const PersonasResponseSchema = z.object({
  personas: z.array(PersonaSchema)
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      console.error('Missing required fields:', { type, data });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'create_persona') {
      if (!data.company || !data.services) {
        console.error('Missing company or services:', data);
        return NextResponse.json(
          { error: 'Missing company or services information' },
          { status: 400 }
        );
      }

      try {
        console.log('Making OpenAI request for persona creation with:', {
          company: data.company,
          services: data.services
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert in creating deeply nuanced customer personas for insurance companies.
              Generate exactly three distinct personas that feel like real individuals with complex life stories.
              
              Guidelines for creating authentic personas:
              - Create rich backstories with specific details about life experiences
              - *Deeply consider how their demographics, financial profile, and past experiences shape their attitudes towards insurance*
              - Add personality quirks and specific habits that make them feel real**
              
              Each persona should feel like a real person you might meet, with unique complexities and outlooks on life.
              Avoid generic descriptions and instead provide specific, memorable details that bring each persona to life.
              
              You must return exactly 3 personas, each with distinctly different backgrounds, life stages, 
              and attitudes toward insurance.`
            },
            {
              role: "user",
              content: `Company: ${data.company}\nServices: ${data.services}`
            }
          ],
          response_format: { 
            type: "json_schema",
            json_schema: {
              name: "PersonasResponse",
              schema: zodToJsonSchema(PersonasResponseSchema),
              strict: true
            }
          }
        });

        if (!completion?.choices?.[0]?.message?.content) {
          console.error('Invalid OpenAI response:', completion);
          throw new Error('Invalid response from OpenAI');
        }

        const result = JSON.parse(completion.choices[0].message.content);
        const validated = PersonasResponseSchema.parse(result);
        
        console.log('GPT Response:', {
          raw: completion.choices[0].message.content,
          parsed: validated,
          usage: completion.usage
        });

        return NextResponse.json(validated);
      } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError);
        return NextResponse.json(
          { error: 'Failed to generate personas from OpenAI', details: openaiError.message },
          { status: 500 }
        );
      }
    } else if (type === 'eval') {
      systemPrompt = `You are an expert sales coach specializing in restaurant partnerships and food delivery services. 
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
      }`;
      userPrompt = `Here's the transcript where the sales rep ('user') is trying to onboard a restaurant ('assistant') to DoorDash: ${data.transcript}`;
    } else {
      console.error('Invalid request type:', type);
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('General API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}