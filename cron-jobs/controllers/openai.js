const {
  About,
  TopClients,
  SWOTAnalysis,
  Industries,
  Products,
  IndustriesJsonSchema,
} = require("../lib/function_calling");
const {
  createMessage,
  createRun,
  getRunStatus,
  cancelRun,
  getMessage,
  toolOutputsToRun,
  deleteAThread,
  modifyAssistant,
  getAssistant,
} = require("../utils/openai_helper");
const Function_Info = require("../utils/functions_info");
const Company = require("../models/Company");
const { deleteFile } = require("../utils/aws_helper");
const { default: axios } = require("axios");
const {naiveJSONFromText} = require("../utils/openai_helper");

const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;

const runPrompt = async (req, res) => {
  const { prompt } = req.body;
  const message = await createMessage(threadId, prompt);
  const openAiFunction = Industries();
  const run = await createRun(assistanceId, threadId, openAiFunction);

  console.log("Run------>", run);

  while (true) {
    const status = await getRunStatus(threadId, run.id);
    // console.log("Status------>", status);
    if (status.status === "completed") {
      const messageOutput = await getMessage(threadId, message.id);
      console.log("Message Output------>", messageOutput.content);
      break;
    } else if (status.status === "failed") {
      throw new Error("Prompt run failed");
    } else if (status.status === "requires_action") {
      const toolCall = status.required_action.submit_tool_outputs.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      console.log("Args ---->", args);
      await toolOutputsToRun(threadId, run.id, toolCall.id);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  res.status(200).json({ message: "Prompt run successfully" });
};

const createThreadandRun = async (
  assistanceId,
  threadId,
  Prompt,
  type,
  companyId
) => {
  const sectionInfo = Function_Info.find((info) => info.section === type);
  const message = await createMessage(assistanceId, threadId, Prompt);
  const run = await createRun(assistanceId, threadId, sectionInfo.parameters);

  while (true) {
    const status = await getRunStatus(threadId, run.id);
    if (status.status === "completed") {
      const messageOutput = await getMessage(threadId, message.id);
      console.log("Message Output------>", messageOutput.content);
      break;
    } else if (status.status === "failed") {
      throw new Error("Prompt run failed");
    } else if (status.status === "requires_action") {
      const toolCall = status.required_action.submit_tool_outputs.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      console.log("Args ---->", args);
      await Company.findByIdAndUpdate(companyId, {
        [type]: args,
      });
      await toolOutputsToRun(threadId, run.id, toolCall.id);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const runStatus = async (req, res) => {
  const { runId, threadId } = req.body;
  const status = await getRunStatus(threadId, runId);
  console.log("Run Status------>", status);

  res.status(200).json({ message: "Run status" });
};

const cancel = async (req, res) => {
  const { runId, threadId } = req.body;
  const status = await cancelRun(threadId, runId);
  res.status(200).json(status);
};

const deleteLocalFile = async (req, res) => {
  const { companyId } = req.body;
  const localPath = `./tmp/${companyId}.md`;
  await deleteFile(localPath);
  res.json({ success: "Deleted" });
};

const deleteThread = async (req, res) => {
  const { threadId } = req.body;
  await deleteAThread(threadId);
  res.json({ success: "Done" });
};

const modifyAssistantController = async (req, res) => {
  const { model, companyId } = req.body;
  console.log("Request Body------>", req.body);
  const company = await Company.findById(companyId);
  const { assistantId } = company;
  await modifyAssistant(assistantId, model);
  res.json({ success: "Done" });
};

const getAssistantController = async (req, res) => {
  const { companyId } = req.query;
  const company = await Company.findById(companyId);
  const { assistantId } = company;
  const assistant = await getAssistant(assistantId);
  res.json(assistant || {});
};

const runAPrompt = async (req, res) => {
  const { prompt, companyId } = req.body;

  let newprompt=`${prompt}\n Do not include any explanations, only provide JSON response following this format without deviation.:\n {"result":"response of the prompt"}\n The JSON response:`;

  const aiResponse = await axios.post(
    `${KNOWLEDGE_BASE_API}/search`,
    {
      query: newprompt,
      company_id: companyId,
    }
  );
  const data = aiResponse.data.result;
  
  const jsonOutput = naiveJSONFromText(data);

  return res.status(200).json(jsonOutput.result);
};

module.exports = {
  runPrompt,
  runStatus,
  cancel,
  createThreadandRun,
  deleteLocalFile,
  deleteThread,
  modifyAssistantController,
  getAssistantController,
  runAPrompt,
};
