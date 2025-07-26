
'use server';
/**
 * @fileOverview An AI flow for recognizing students in a photo.
 *
 * - recognizeStudents - A function that handles the student recognition process.
 * - RecognizeStudentsInput - The input type for the recognizeStudents function.
 * - RecognizeStudentsOutput - The return type for the recognizeStudents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentSchema = z.object({
    id: z.string().describe('The unique identifier for the student.'),
    imageUrl: z.string().describe("The URL of the student's profile photo."),
});

const RecognizeStudentsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the classroom, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  students: z.array(StudentSchema).describe('A list of students to identify in the photo.'),
});
export type RecognizeStudentsInput = z.infer<typeof RecognizeStudentsInputSchema>;

const RecognizeStudentsOutputSchema = z.object({
  presentStudentIds: z.array(z.string()).describe('An array of IDs for the students identified as present in the photo.'),
});
export type RecognizeStudentsOutput = z.infer<typeof RecognizeStudentsOutputSchema>;


const prompt = ai.definePrompt({
    name: 'recognizeStudentsPrompt',
    input: {schema: RecognizeStudentsInputSchema},
    output: {schema: RecognizeStudentsOutputSchema},
    prompt: `You are a highly accurate facial recognition expert. Your task is to identify which of the registered students appear in the provided class photo.

Analyze the main class photo carefully.
Class Photo:
{{media url=photoDataUri}}

Now, compare the faces in the class photo with the following student profile images.
{{#each students}}
- Student ID: \`{{this.id}}\`
  Profile Photo: {{media url=this.imageUrl}}
{{/each}}

Based on your analysis, provide an array containing the unique IDs of only the students who are clearly visible and identifiable in the class photo. Your response must be in the specified JSON format.`,
});

const recognizeStudentsFlow = ai.defineFlow(
  {
    name: 'recognizeStudentsFlow',
    inputSchema: RecognizeStudentsInputSchema,
    outputSchema: RecognizeStudentsOutputSchema,
  },
  async input => {
    if (input.students.length === 0) {
        return { presentStudentIds: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

export async function recognizeStudents(input: RecognizeStudentsInput): Promise<RecognizeStudentsOutput> {
  return recognizeStudentsFlow(input);
}
