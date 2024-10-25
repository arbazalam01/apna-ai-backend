const { OpenAI } = require("openai");
const fs = require("fs");
const { deleteFile } = require("./aws_helper");
const { jsonrepair } = require("jsonrepair");
const { backOff } = require("exponential-backoff");
const axios = require("axios");
const { query } = require("express");

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});

const ASSISTANT_INSTRUCTION = process.env.ASSISTANT_INSTRUCTION;
const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;

const uploadFile = async (filePath) => {
  try {
    const file = await openai.files.create({
      purpose: "assistants",
      file: fs.createReadStream(filePath),
    });

    return file.id;
  } catch (err) {
    return null;
  }
};

const uploadMultipleFile = async (filePaths) => {
  try {
    const fileIds = [];

    for (const filePath of filePaths) {
      const file = await openai.files.create({
        purpose: "assistants",
        file: fs.createReadStream(filePath),
      });
      await deleteFile(filePath);
      fileIds.push(file.id);
    }

    return fileIds;
  } catch (err) {
    console.log("Error uploading files:", err);
    return null;
  }
};

const createVectorStore = async (name, fileId) => {
  const vectorStore = await openai.beta.vectorStores.create({
    name,
    file_ids: fileId,
  });
  return vectorStore.id;
};

const createAssistant = async (fileIds, instruction, name) => {
  const assistant = await openai.beta.assistants.create({
    name,
    instructions: instruction,
    tools: [{ type: "retrieval" }, { type: "code_interpreter" }],
    model: process.env.GPT_MODEL,
    file_ids: fileIds,
  });
  return assistant.id;
};

const createAssistantforMultipleFile = async (fileIds) => {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Company Info Extractor",
      instructions: ASSISTANT_INSTRUCTION,
      tools: [{ type: "retrieval" }, { type: "code_interpreter" }],
      model: process.env.GPT_MODEL,
      file_ids: fileIds,
    });

    return assistant.id;
  } catch (err) {
    console.log("Error creating assistant:", err);
    return null;
  }
};

const createAssistantV2 = async (
  vectorStoreId,
  name,
  instruction = ASSISTANT_INSTRUCTION
) => {
  const assistant = await openai.beta.assistants.create({
    name,
    instructions: instruction,
    model: process.env.GPT_MODEL,
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStoreId],
      },
    },
  });
  return assistant.id;
};

const modifyAssistant = async (assistantId, model) => {
  try {
    const assistant = await openai.beta.assistants.update(assistantId, {
      model: model,
    });

    return assistant.id;
  } catch (err) {
    console.log("Error modifying assistant:", err);
    return null;
  }
};

const getAssistant = async (assistantId) => {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (err) {
    console.log("Error getting assistant:", err);
    return null;
  }
};

const createEmptyThread = async () => {
  const emptyThread = await openai.beta.threads.create();
  return emptyThread.id;
};
const deleteAThread = async (threadId) => {
  await openai.beta.threads.del(threadId);
};
const createMessage = async (threadId, message, fileId = null) => {
  let threadMessage;
  if (!fileId) {
    threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
  } else {
    threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
      file_ids: [fileId],
    });
  }
  return threadMessage;
};

const createRun = async (assistantId, threadId, instruction) => {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  return run;
};

const getRunStatus = async (threadId, runId) => {
  const status = await openai.beta.threads.runs.retrieve(threadId, runId);
  return status;
};

const cancelRun = async (threadId, runId) => {
  const status = await openai.beta.threads.runs.cancel(threadId, runId);
  return status;
};

const getMessage = async (threadId) => {
  const message = await openai.beta.threads.messages.list(threadId);
  return message.data[0].content[0].text.value;
};

const retrieveMessage = async (threadId, messageId) => {
  const message = await openai.beta.threads.messages.retrieve(
    threadId,
    messageId
  );
  return message.content[0].text.value;
};

const toolOutputsToRun = async (threadId, runId, toolId) => {
  const run = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    {
      tool_outputs: [
        {
          tool_call_id: toolId,
          output: "Success",
        },
      ],
    }
  );
};

const modifyRun = async (threadId, runId) => {
  const run = await openai.beta.threads.runs.update(threadId, runId);
  return run;
};

const runSinglePrompt = async (assistantId, threadId, promptSection) => {
  const { prompt, json_format, updateFunction } = promptSection;
  const finalPrompt = `${prompt}\n Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;
  const message = await createMessage(threadId, finalPrompt);
  let run = await createRun(assistantId, threadId);
  let finalJsonOutput = {};

  const JsonResponsePromise = new Promise(async (resolve, reject) => {
    while (true) {
      const status = await getRunStatus(threadId, run.id);
      if (status.status === "completed") {
        const outputMsg = await getMessage(threadId);
        // const outputMsg = await retrieveMessage(threadId, message.id);
        console.log("Raw output---->", outputMsg);
        const jsonOutput = naiveJSONFromText(outputMsg);
        finalJsonOutput = jsonOutput;
        resolve();
        break;
      } else if (status.status === "failed") {
        console.log("AI failed");
        resolve();
        break;
      } else {
        console.log("AI working!!!");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  await JsonResponsePromise;
  return finalJsonOutput;
};

const naiveJSONFromText = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const jsonRepair = jsonrepair(match[0]);
    return JSON.parse(jsonRepair);
  } catch {
    return null;
  }
};

const runProspect = async (fileIds, prompt, instruction, name) => {
  try {
    const assistantId = await createAssistant(fileIds, instruction, name);
    const threadId = await createEmptyThread();

    await createMessage(threadId, prompt);
    const run = await createRun(assistantId, threadId);
    let finalJsonOutput = {};

    const JsonResponsePromise = new Promise(async (resolve, reject) => {
      while (true) {
        const status = await getRunStatus(threadId, run.id);
        if (status.status === "completed") {
          const outputMsg = await getMessage(threadId);
          console.log("Raw output---->", outputMsg);
          // const jsonOutput = naiveJSONFromText(outputMsg);
          // finalJsonOutput = jsonOutput;
          finalJsonOutput = outputMsg;
          resolve();
          break;
        } else if (status.status === "failed") {
          console.log("AI failed");
          resolve();
          break;
        } else {
          console.log("AI working!!!");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    });
    await JsonResponsePromise;
    return finalJsonOutput;
  } catch (err) {
    console.log("Error in runProspect-->", err);
    return null;
  }
};

const emailGeneratePrompt = async (assistantId, threadId, finalPrompt) => {
  // const { prompt, json_format, updateFunction } = promptSection;
  // const finalPrompt = `${prompt}\n Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;
  await createMessage(threadId, finalPrompt);
  const run = await createRun(assistantId, threadId);
  let finalJsonOutput = {};

  const JsonResponsePromise = new Promise(async (resolve, reject) => {
    while (true) {
      const status = await getRunStatus(threadId, run.id);
      if (status.status === "completed") {
        const outputMsg = await getMessage(threadId);
        console.log("Raw output---->", outputMsg);
        const jsonOutput = naiveJSONFromText(outputMsg);
        finalJsonOutput = jsonOutput;
        resolve();
        break;
      } else if (status.status === "failed") {
        console.log("AI failed");
        resolve();
        break;
      } else {
        console.log("AI working!!!");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
  await JsonResponsePromise;
  return finalJsonOutput;
};

const newProspectGenerate = async (assistantId, threadId, finalPrompt) => {
  // const { prompt, json_format, updateFunction } = promptSection;
  // const finalPrompt = `${prompt}\n Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;
  await createMessage(threadId, finalPrompt);
  const run = await createRun(assistantId, threadId);
  let finalJsonOutput = {};

  const JsonResponsePromise = new Promise(async (resolve, reject) => {
    while (true) {
      const status = await getRunStatus(threadId, run.id);
      if (status.status === "completed") {
        const outputMsg = await getMessage(threadId);
        // console.log("Raw output---->", outputMsg);
        // const jsonOutput = naiveJSONFromText(outputMsg);
        finalJsonOutput = outputMsg;
        resolve();
        break;
      } else if (status.status === "failed") {
        console.log("AI failed");
        resolve();
        break;
      } else {
        console.log("AI working!!!");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
  await JsonResponsePromise;
  return finalJsonOutput;
};

const threadAndRunV2 = async (assistantId, finalPrompt, fileId) => {
  const execute = async () => {
    try {
      console.log("AI Working !!!");

      const run = await openai.beta.threads.createAndRunPoll({
        assistant_id: assistantId,
        thread: {
          messages: [
            {
              role: "user",
              content: finalPrompt,
              attachments: [
                {
                  file_id: fileId,
                  tools: [{ type: "file_search" }],
                },
              ],
            },
          ],
        },
      });

      if (run.status === "completed") {
        const message = await getMessage(run.thread_id);
        const jsonOutput = naiveJSONFromText(message);
        return jsonOutput;
      }
      return null;
    } catch (err) {
      console.log("Error in AI threadAndRunV2-->", err);
      throw new Error("Error in threadAndRunV2", err); // Throw the error to trigger a retry
    }
  };

  try {
    const result = await backOff(execute, {
      jitter: "full",
      delayFirstAttempt: true,
      numOfAttempts: 5, // Optional: number of retry attempts
      startingDelay: 1000 * 3, // Optional: starting delay in milliseconds
      maxDelay: 1000 * 60, // Optional: maximum delay between retries
    });
    return result;
  } catch (err) {
    console.log("All retries failed:", err);
    return null; // Return null if all retries fail
  }
};

const createThreadAndRun = async (assistantId, finalPrompt) => {
  const execute = async () => {
    try {
      const run = await openai.beta.threads.createAndRunPoll({
        assistant_id: assistantId,
        thread: {
          messages: [{ role: "user", content: finalPrompt }],
        },
      });

      if (run.status === "completed") {
        const message = await getMessage(run.thread_id);
        const jsonOutput = naiveJSONFromText(message);
        return jsonOutput;
      } else {
        throw new Error("Thread not completed");
      }
    } catch (err) {
      console.log("Error in createThreadAndRun-->", err);
      throw new Error("Error in createThreadAndRun", err);
    }
  };

  try {
    const result = await backOff(execute, {
      jitter: "full",
      delayFirstAttempt: true,
      numOfAttempts: 5, // Optional: number of retry attempts
      startingDelay: 100 * 3, // Optional: starting delay in milliseconds
      maxDelay: 1000 * 60, // Optional: maximum delay between retries
    });
    return result;
  } catch (err) {
    console.log("All retries failed:", err);
    throw err;
  }
};

const createThreadAndRunonKnowledgeBase = async (companyId, finalPrompt) => {
  const execute = async () => {
    try {
      // await scrapeData(company.weburl, company.id);
      const apiRes = await axios.post(`${KNOWLEDGE_BASE_API}/search`, {
        query: finalPrompt,
        company_id: companyId,
      });

      const data = apiRes.data.result;
      console.log("data-->", data);
      const jsonOutput = naiveJSONFromText(data);
      console.log("jsonOutput-->", jsonOutput);

      return jsonOutput;
    } catch (err) {
      console.log("Error in createThreadAndRunonKnowledgeBase-->", err);
      throw new Error("Error in createThreadAndRunonKnowledgeBase", err);
    }
  };

  try {
    const result = await backOff(execute, {
      jitter: "full",
      delayFirstAttempt: true,
      numOfAttempts: 5, // Optional: number of retry attempts
      startingDelay: 100 * 3, // Optional: starting delay in milliseconds
      maxDelay: 1000 * 60, // Optional: maximum delay between retries
    });
    return result;
  } catch (err) {
    console.log("All retries failed:", err);
    throw err;
  }
};
// Function to create an image with DALL-E
const createImage = async (prompt) => {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    const imageUrl = response.data[0].url;
    return imageUrl;
  } catch (error) {
    console.error("Error creating image:", error);
  }
};

module.exports = {
  uploadFile,
  createAssistant,
  createEmptyThread,
  createMessage,
  createRun,
  getRunStatus,
  cancelRun,
  getMessage,
  toolOutputsToRun,
  runSinglePrompt,
  deleteAThread,
  uploadMultipleFile,
  createAssistantforMultipleFile,
  runProspect,
  emailGeneratePrompt,
  newProspectGenerate,
  modifyAssistant,
  getAssistant,
  createAssistantV2,
  createVectorStore,
  createThreadAndRun,
  threadAndRunV2,
  createImage,
  createThreadAndRunonKnowledgeBase,
  naiveJSONFromText,
};
