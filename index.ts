import * as core from "@actions/core";
import * as github from "@actions/github";
import { IssuesEvent, Label } from "@octokit/webhooks-definitions/schema";

interface mapping {
  [key: string]: string;
}

function main() {
  const githubToken = core.getInput("githubToken");
  const labelMapping = getLabelMapping();
  const octokit = github.getOctokit(githubToken);
  const repository = github.context.repo;
  const payload = github.context.payload as IssuesEvent;
  const labels = payload.issue.labels?.map((x: Label) => x?.name);

  const leftovers = getLeftoverLabels(labelMapping, labels ? labels : []);
  const values = Object.values(leftovers);
  const properties = Object.keys(leftovers);
  octokit.rest.issues.addLabels({
    owner: repository.owner,
    repo: repository.repo,
    issue_number: payload.issue.number,
    labels: values,
  });
}

function getLeftoverLabels(mapping: mapping, labels: string[]) {
  for (const label of labels) {
    const splitLabel = label.split(":");
    const baseLabel = splitLabel[0].toLowerCase().trim();
    delete mapping[baseLabel];
  }
  return mapping;
}

function getLabelMapping() {
  const labelMapping: mapping = {};
  for (var key in process.env) {
    if (key.indexOf("INPUT_LABELMAP") == 0) {
      const mapData = process.env[key] as string;
      const [labelType, missingLabel] = mapData.split("~");
      labelMapping[labelType.trim().toLowerCase()] = missingLabel.trim();
    }
  }
  return labelMapping;
}

main();
