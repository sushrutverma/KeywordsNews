import axios, { AxiosError } from 'axios';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  throw new Error('Missing Mistral API key in environment variables');
}

interface AIError {
  message: string;
  details?: string;
  status?: number;
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const aiService = {
  async analyze(text: string) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
      const response = await axios.post<MistralResponse>(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing text. Analyze the following text and provide key insights.'
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        analysis: response.data.choices[0].message.content
      };
    } catch (error) {
      const aiError: AIError = {
        message: 'Failed to analyze text'
      };

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          aiError.status = axiosError.response.status;
          aiError.details = axiosError.response.data?.error?.message || `Server responded with status ${axiosError.response.status}`;
          
          if (axiosError.response.status === 401) {
            aiError.message = 'Invalid API key';
          } else if (axiosError.response.status === 429) {
            aiError.message = 'Rate limit exceeded';
          }
        } else if (axiosError.request) {
          aiError.details = 'No response received from server. Please check your internet connection.';
        } else {
          aiError.details = axiosError.message;
        }
      } else {
        aiError.details = error instanceof Error ? error.message : 'An unexpected error occurred';
      }

      console.error('AI analysis error:', aiError);
      throw aiError;
    }
  },

  async summarize(text: string) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
      const response = await axios.post<MistralResponse>(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at summarizing text. Provide a concise summary of the following text in 2-3 sentences.'
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        summary: response.data.choices[0].message.content
      };
    } catch (error) {
      const aiError: AIError = {
        message: 'Failed to summarize text'
      };

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          aiError.status = axiosError.response.status;
          aiError.details = axiosError.response.data?.error?.message || `Server responded with status ${axiosError.response.status}`;
          
          if (axiosError.response.status === 401) {
            aiError.message = 'Invalid API key';
          } else if (axiosError.response.status === 429) {
            aiError.message = 'Rate limit exceeded';
          }
        } else if (axiosError.request) {
          aiError.details = 'No response received from server. Please check your internet connection.';
        } else {
          aiError.details = axiosError.message;
        }
      } else {
        aiError.details = error instanceof Error ? error.message : 'An unexpected error occurred';
      }

      console.error('AI summarization error:', aiError);
      throw aiError;
    }
  }
};