import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ResumeAnalysis {
  personalDetails: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  matchPercentage: number;
  atsResume: string;
  coverLetter: string;
  linkedinTips: string[];
  skillUpgrades: { skill: string; youtubeLink: string }[];
  interviewQuestions: { question: string; tip: string }[];
  careerRoadmap: { step: string; description: string }[];
  summary: string;
}

export async function analyzeResume(resumeText: string, jobDescription: string): Promise<ResumeAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Analyze the following resume against the job description to create a high-impact, professional career suite.
      
      Resume:
      ${resumeText}
      
      Job Description:
      ${jobDescription}
      
      Provide a comprehensive career suite including:
      1. Extract personal details (name, email, phone, location, linkedin) from the resume. If not found, use placeholders like "[Your Name]".
      2. Match percentage (0-100) based on how well the resume aligns with the JD's core requirements.
      3. A rewritten, highly professional ATS-optimized resume in Markdown format. 
         - Use standard sentence casing (do NOT use all-caps for headers or sections).
         - Use a clean, standard layout: Contact Info -> Professional Summary -> Core Competencies (Keywords) -> Professional Experience -> Education -> Certifications/Skills.
         - Quantify achievements using the STAR method (Situation, Task, Action, Result) where possible.
         - Strategically integrate keywords from the Job Description to ensure high ATS scannability.
         - Ensure the tone is professional, confident, and achievement-oriented.
         - Use proper Markdown spacing (two newlines between sections) to ensure clear rendering.
      4. A tailored, persuasive cover letter in Markdown format.
         - Use standard sentence casing.
         - Address it to the Hiring Manager.
         - Use a formal letter format: Date, Recipient Info, Salutation, Body (3-4 paragraphs), Closing, Signature.
         - Clearly articulate the value proposition: how the candidate's specific skills and experiences directly solve the challenges mentioned in the JD.
         - Maintain a professional yet enthusiastic tone.
         - Ensure proper paragraph breaks with double newlines.
      5. 5 LinkedIn profile optimization tips to align the candidate's online presence with this specific role.
      6. 3-5 high-priority skills to upgrade with a direct YouTube search link for each (format: https://www.youtube.com/results?search_query=learn+[skill]).
      7. 5 potential interview questions (behavioral and technical) with a strategic tip on how to answer each.
      8. A 3-step career roadmap to reach the level required for this job or to excel in it.
      9. A brief, professional summary of the match, highlighting the strongest alignments and any critical gaps.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personalDetails: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              linkedin: { type: Type.STRING }
            },
            required: ["name", "email", "phone", "location", "linkedin"]
          },
          matchPercentage: { type: Type.NUMBER },
          atsResume: { type: Type.STRING },
          coverLetter: { type: Type.STRING },
          linkedinTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          skillUpgrades: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                youtubeLink: { type: Type.STRING }
              },
              required: ["skill", "youtubeLink"]
            }
          },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                tip: { type: Type.STRING }
              },
              required: ["question", "tip"]
            }
          },
          careerRoadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["step", "description"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["personalDetails", "matchPercentage", "atsResume", "coverLetter", "linkedinTips", "skillUpgrades", "interviewQuestions", "careerRoadmap", "summary"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  
  // Sanitize strings to handle literal \n sequences that AI might return
  const sanitize = (str: string) => str.replace(/\\n/g, '\n');
  
  if (result.atsResume) result.atsResume = sanitize(result.atsResume);
  if (result.coverLetter) result.coverLetter = sanitize(result.coverLetter);
  if (result.summary) result.summary = sanitize(result.summary);
  
  return result;
}

export async function optimizeContent(type: 'summary' | 'experience', content: string, jobDescription: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Optimize the following ${type} for the given job description to be more impactful and ATS-friendly.
      
      Content to optimize:
      ${content}
      
      Job Description:
      ${jobDescription}
      
      Provide only the optimized text in Markdown format.
    `,
  });
  return response.text || "";
}
