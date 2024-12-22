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
    income_bracket: z.string().describe('Specific annual income range with context about career progression and household earnings.'),
    location_type: z.string().describe('Detailed description of living environment including specific region, community type, and local economic conditions.')
  }),
  life_stage: z.object({
    family_status: z.string().describe('Detailed family dynamics including relationship history, family structure, and living arrangements.'),
    dependents: z.number().describe('Number and types of dependents including children, elderly parents, or other family members requiring support.'),
    major_milestones: z.array(z.string()).describe('Specific life events with dates and impact on financial/insurance decisions (e.g., career changes, relocations, health events).')
  }),
  financial_profile: z.object({
    income_stability: z.string().describe('Detailed assessment of income sources, job security, and future earning potential.'),
    risk_appetite: z.string().describe('Specific risk tolerance with examples of past financial decisions and investment choices.'),
    assets: z.array(z.string()).describe('Comprehensive list of assets with specific details (e.g., home value, investment types, inheritance expectations).'),
    debt: z.array(z.string()).describe('Detailed breakdown of current debts including amounts, terms, and impact on financial planning.')
  }),
  experiences_and_health: z.object({
    past_experiences: z.string().describe('Detailed narrative of specific insurance interactions, claims history, and how these shaped current attitudes.'),
    health_status: z.string().describe('Comprehensive health profile including specific conditions, medications, lifestyle factors, and preventive care habits.'),
    family_health_history: z.string().describe('Detailed medical history across generations, including specific conditions, age of onset, and preventive measures taken.')
  }),
  values_and_mindset: z.object({
    core_values: z.array(z.string()).describe('Deep-rooted beliefs and principles that drive major life decisions, shaped by personal experiences.'),
    worldview: z.string().describe('Complex perspective on life incorporating cultural background, personal experiences, and future outlook.'),
    trust_in_insurance: z.string().describe('Nuanced view of insurance industry based on personal/family experiences, cultural factors, and specific company interactions.')
  })
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
          model: "gpt-4o-2024-08-06",
          messages: [
            {
              role: "system",
              content: `You are an expert in creating deeply nuanced customer personas for insurance companies.
              Generate exactly three distinct personas that feel like real individuals with complex life stories.
              
              Guidelines for creating authentic personas:
              - Create rich backstories with specific details about life experiences
              - Include complex health histories with multiple conditions and family patterns
              - Detail specific financial situations including exact figures and multiple income sources
              - Describe precise insurance experiences with specific companies, claim amounts, and outcomes
              - Include cultural and personal values that shape their decision-making
              - **Add personality quirks and specific habits that make them feel real**
              - Consider how their past experiences shape their current attitudes
              - Include specific regional and cultural influences on their perspectives
              
              Each persona should feel like a real person you might meet, with unique challenges, 
              aspirations, and complexities. Avoid generic descriptions and instead provide specific, 
              memorable details that bring each persona to life.
              
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