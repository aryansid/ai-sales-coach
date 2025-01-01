import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  summary: z.string().describe('A very concise summary of the persona. Limit to STRICTLY 3 words.')
});

const PersonasResponseSchema = z.object({
  personas: z.array(PersonaSchema)
});

// New evaluation schema without length constraints
const evaluationSchema = z.object({
  scores: z.array(z.object({
    category: z.string(),
    score: z.number(),
    description: z.string()
  })),
  insights: z.array(z.object({
    message: z.string(),
    suggestion: z.string()
  }))
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
              - Create rich backstories with specific details about life (especially insurance) experiences
              - *Deeply consider how their demographics, financial profile, and past experiences shape their attitudes towards insurance*
              - Add personality quirks and specific habits that make them feel real
              
              Each persona should feel like a real person you might meet, with unique complexities and outlooks on life.
              Avoid generic descriptions and instead provide specific, memorable details that bring each persona to life.
              
              You must return exactly 3 personas.`
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

        try {
          const result = JSON.parse(completion.choices[0].message.content);
          const validated = PersonasResponseSchema.parse(result);
          
          console.log('GPT Response:', {
            raw: completion.choices[0].message.content,
            parsed: validated,
            usage: completion.usage
          });

          return NextResponse.json(validated);

        } catch (parseError: any) {
          console.error('JSON Parse Error:', parseError);
          return NextResponse.json(
            { 
              error: 'Failed to parse OpenAI response', 
              details: parseError?.message || 'Unknown parsing error'
            },
            { status: 500 }
          );
        }

      } catch (openaiError: any) {
        console.error('OpenAI API Error:', openaiError);
        return NextResponse.json(
          { 
            error: 'Failed to generate personas from OpenAI', 
            details: openaiError?.message || 'Unknown OpenAI error'
          },
          { status: 500 }
        );
      }
    } 
    else if (type === 'create_scenario') {
      if (!data.persona || !data.scenario_type || !data.services) {
        console.error('Missing required fields:', data);
        return NextResponse.json(
          { error: 'Missing required information (persona, scenario type, or services)' },
          { status: 400 }
        );
      }

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are creating a cold call training scenario for insurance sales representatives to practice their sales conversations.
              
              You are given three important inputs. You must use all three inputs to create a scenario. 
              1. Type of sales scenario
                  - Rapport building
                  - Objection handling
                  - Closing 
              2. Specific details about the customer 
              3. The insurance services being sold

            Here's an example of how to combine all three inputs effectively:

             Inputs:
             - Persona: Sarah Chen, 42-year-old Chinese-American pediatric surgeon, recently divorced, family history of Alzheimer's. Lost 40% savings in crypto. Works 70-hour weeks.
             - Scenario Type: Objection Handling 
             - Services: Premium health and life insurance packages

             Scenario:
             "You are calling Sarah during her lunch break between surgeries. She's tense after a difficult morning at the hospital. While interested in coverage, she's skeptical of financial products due to recent crypto losses. Time is limited - she has another surgery soon. You are at a critical moment in the call. She just revealed that her ex-husband works for a competing insurance company and warned her about a specific clause in your policy regarding coverage during high-risk surgical procedures - something she performs daily. You must handle this objection otherwise she will hang up"
             
             This is a great source of inspiration! Notice how this scenario incorporates the three inputs creatively yet maintains very specific details, gets directly to the point ( + doesn't give sales advice, setups the situation ), and sounds like a real, unique context. YOU SHOULD OBVIOUSLY NOT COPY THIS EXACTLY ( e.g. you have a tendency to overuse the break example - be creative with scenarios )   
              `
            },
            {
              role: "user",
              content: `Generate a ${data.scenario_type} scenario with these details:

              Details about the customer:
              ${JSON.stringify(data.persona, null, 2)}

              The insurance service being sold:
              ${data.services}

              Create a specific training scenario that sales reps can use to practice handling this exact type of customer and situation.
              
              CRITICAL GUIDELINES:
              - BE VERY SPECIFIC AND NUANCED. THINK DEEPLY ABOUT EACH AND EVERY ATTRIBUTE OF THE THREE INPUT AND COMBINE THEM. PRESENT A UNIQUE SITUATION.
              - JUST SETUP THE SITUATION. DO NOT TELL WHAT THE SALES REP SHOULD DO. TELL THEM WHAT THE SITUATION IS. 
              - KEEP IT BRIEF BUT NUANCED. 2-3 sentences maximum that set up the situation in a specific, unique context.
              - BE VERY CLEAR. Who are you calling? What's unique about this call? What's the situation? What stage of the sales process are you in -- are you about to call them for the first time, or are you in the middle of the call already (e.g., if it's closing, you're going to be at a critical moment in the call and need to close the deal soon)
              - START DIRECTLY WITH THE SCENARIO DESCRIPTION - NO HEADERS OR LABELS.
              - ALWAYS A COLD CALL SCENARIO. 
              - GET STRAIGHT TO THE RELEVANT FACTS. NO FANCY STORYTELLING OR SCENE-SETTING. 
              
              `
            }
          ]
        });

        if (!completion?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response from OpenAI');
        }

        console.log('GPT Response:', completion.choices[0].message.content);

        return NextResponse.json({ scenario: completion.choices[0].message.content });

      } catch (error: any) {
        console.error('Scenario Creation Error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to generate scenario', 
            details: error?.message || 'Unknown error' 
          },
          { status: 500 }
        );
      }
    }
    else if (type === 'eval') {
      const systemPrompt = `You are an expert sales coach specializing in insurance sales and customer relationships. 
      You're analyzing a conversation between an insurance sales representative and a potential customer.
      
      Analyze the conversation focusing on EXACTLY these 3 categories (no more, no less):
      1. Understanding & Personalization: How well did the rep understand and personalize their approach?
      2. Objection Handling & Trust: How effectively did they handle concerns and build trust?
      3. Value Communication: How clearly did they communicate the insurance product value?

      For each category, provide:
      - A score from 0-100
      - Specific, actionable feedback
      
      Then extract EXACTLY 3 key moments from the conversation (no more, no less), each with:
      - A specific quote from the conversation
      - An actionable suggestion for improvement`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here's the transcript where the sales rep (ALWAYS 'user') is trying to sell insurance products to a potential customer (ALWAYS'assistant'): ${data.transcript}` }
          ],
          response_format: { 
            type: "json_schema",
            json_schema: {
              name: "EvaluationResponse",
              schema: zodToJsonSchema(evaluationSchema),
              strict: true
            }
          }
        });

        if (!completion?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response from OpenAI');
        }

        // Validate the response against our schema
        const parsedResponse = evaluationSchema.parse(JSON.parse(completion.choices[0].message.content));
        return NextResponse.json(parsedResponse);

      } catch (error: any) {
        console.error('Evaluation Error:', error);
        return NextResponse.json(
          { 
            error: 'Failed to analyze conversation', 
            details: error?.message || 'Unknown evaluation error' 
          },
          { status: 500 }
        );
      }
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('POST request API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process POST request', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}