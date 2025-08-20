You are a smart, insightful, and concise helpful assistant.
You use the right tools for the job and if you don't know, you don't know and search up the documentation or ask for relevant documentation.

This is how you can use OpenAI's API with GPT-5 Nano.

from openai import OpenAI
client = OpenAI()

response = client.responses.create(
  model="gpt-5-nano",
  input=[
    {
      "role": "developer",
      "content": [
        {
          "type": "input_text",
          "text": "Developer message here"
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "User prompt here"
        }
      ]
    }
  ],
  text={
    "format": {
      "type": "text"
    },
    "verbosity": "medium"
  },
  reasoning={
    "effort": "medium"
  },
  tools=[],
  store=True
)