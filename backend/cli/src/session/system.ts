import { Ripgrep } from "../file/ripgrep"

import { Instance } from "../project/instance"
import { SessionFilesystem } from "./filesystem"

import PROMPT_RESPONSE from "./prompt/response.txt"
import PROMPT_SCIENCE from "../agent/prompt/science.txt"
import PROMPT_ANTHROPIC from "../agent/prompt/anthropic.txt"
import PROMPT_ASTRA from "../agent/prompt/gpt-astra.txt"
import PROMPT_GPT from "../agent/prompt/gpt.txt"
import PROMPT_CODEX from "../agent/prompt/codex.txt"
import PROMPT_GEMINI from "../agent/prompt/gemini.txt"
import PROMPT_DEFAULT from "../agent/prompt/default.txt"
import type { Agent } from "@/agent/agent"
import { SkillCatalog } from "../skill/catalog"
import { Skill } from "../skill"
import { searchSkills } from "../skill/search"
import { PermissionNext } from "../permission/next"
import { ProjectAccess } from "../project/access"
import { ImageRoute } from "../tool/image-route"

export namespace SystemPrompt {
  const skillPrompts = new WeakMap<Skill.Info[], Map<string, string>>()

  export type Family = "anthropic" | "gpt-astra" | "gpt" | "codex" | "gemini" | "default"

  const FAMILY: Record<Family, string> = {
    anthropic: PROMPT_ANTHROPIC,
    "gpt-astra": PROMPT_ASTRA,
    gpt: PROMPT_GPT,
    codex: PROMPT_CODEX,
    gemini: PROMPT_GEMINI,
    default: PROMPT_DEFAULT,
  }

  /** The slot every family file and the specialist template carry; the shared
   * science block is substituted at render time so it is identical everywhere. */
  export const SCIENCE_SLOT = "{{SCIENCE}}"
  export const DOMAIN_SKILLS_SLOT = "{{DOMAIN_SKILLS}}"

  export function science() {
    return PROMPT_SCIENCE.trim()
  }

  /** Header family by wire model id, in OpenCode's order. */
  export function family(id: string): Family {
    const lower = id.toLowerCase()
    if (lower.includes("gpt-4") || lower.includes("o1") || lower.includes("o3")) return "gpt"
    if (lower.includes("gpt")) {
      if (lower.includes("gpt-6") || lower.includes("astra")) return "gpt-astra"
      if (lower.includes("codex")) return "codex"
      return "gpt"
    }
    if (lower.includes("gemini-")) return "gemini"
    if (lower.includes("claude")) return "anthropic"
    return "default"
  }

  export function response(prompt: string) {
    return `${prompt.trim()}\n\n${PROMPT_RESPONSE.trim()}`
  }

  /** The model-family header with the science block filled and the writing
   * defaults appended: what an agent without a prompt of its own receives. */
  export function header(model: { api: { id: string } }) {
    return response(FAMILY[family(model.api.id)].replace(SCIENCE_SLOT, science()))
  }

  export function provider(model: { api: { id: string } }) {
    return [header(model)]
  }

  /** Fill an agent prompt's slots: the science block, and the agent's domain
   * skill index when it declares skill categories. */
  export async function render(agent: Agent.Info): Promise<Agent.Info> {
    if (!agent.prompt) return agent
    const withScience = agent.prompt.replace(SCIENCE_SLOT, science())
    if (!withScience.includes(DOMAIN_SKILLS_SLOT)) return { ...agent, prompt: withScience }
    const index = (await domainSkills(agent.skills ?? [], agent.permission)) ?? ""
    return { ...agent, prompt: withScience.replace(DOMAIN_SKILLS_SLOT, index).trim() }
  }

  /** A slash token is an explicit request for a command or skill. */
  export function slashInvocation(message?: string) {
    return /(?:^|[\s([{'"])\/([a-z0-9][a-z0-9_-]*)(?=$|[^a-z0-9_/-])/i.test(message ?? "")
  }

  /** The skills a request names with a slash, as their exact catalog names,
   * in the order written and without repeats. A token that names no skill
   * (a command such as /compact, a path fragment) is not one. */
  export function invokedSkills(message: string | undefined, skills: readonly Pick<Skill.Info, "name">[]) {
    const names = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill.name]))
    return [...(message ?? "").matchAll(/(?:^|[\s([{'\"])\/([a-z0-9][a-z0-9_-]*)(?=$|[^a-z0-9_/-])/gi)]
      .map((match) => match[1].toLowerCase())
      .map((name) => names.get(name) ?? names.get(SkillCatalog.resolve(name).toLowerCase()))
      .filter((name): name is string => !!name)
      .filter((name, index, all) => all.indexOf(name) === index)
  }

  function sentence(text: string) {
    const first = text.split(/(?<=[.!?])\s+/)[0] ?? text
    return first.length > 140 ? `${first.slice(0, 137)}...` : first
  }

  /** The `<domain-skills>` index of a specialist: every skill in its
   * categories, one line each, grouped by category. */
  export async function domainSkills(categories: string[], permission: PermissionNext.Ruleset) {
    if (!categories.length) return
    const catalog = (await Skill.catalog(permission)).allowed
    const groups = categories
      .map((category) => ({
        category,
        skills: catalog.filter((skill) => skill.category === category).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((group) => group.skills.length)
    if (!groups.length) return
    return [
      "<domain-skills>",
      "Your domain library. Load a skill with skill({name}) when its procedure applies; load one at a time and do not narrate the load.",
      ...groups.flatMap((group) => [
        `${group.category}:`,
        ...group.skills.map((skill) => `- ${skill.name}: ${skill.summary ?? sentence(skill.description)}`),
      ]),
      "</domain-skills>",
    ].join("\n")
  }

  export async function availableSkills(permission: PermissionNext.Ruleset, message?: string) {
    const catalog = (await Skill.catalog(permission)).allowed
    const key = (message?.length ?? 0) <= 8_192 ? JSON.stringify([permission, message ?? ""]) : undefined
    const cache = (() => {
      const current = skillPrompts.get(catalog)
      if (current) return current
      const value = new Map<string, string>()
      skillPrompts.set(catalog, value)
      return value
    })()
    if (key) {
      const cached = cache.get(key)
      if (cached) return cached
    }
    const publish = (value: string) => {
      if (!key) return value
      cache.set(key, value)
      if (cache.size > 32) cache.delete(cache.keys().next().value!)
      return value
    }
    const skills = catalog
    if (skills.length === 0) {
      return publish(
        [
          "<available-skills>",
          "No skills are currently available. Static skill routing tables are guidance only.",
          "Do not call the skill tool because no skill name will resolve.",
          "</available-skills>",
        ].join("\n"),
      )
    }

    const groups = new Map<string, number>()
    for (const skill of skills) {
      const category = skill.category ?? "other"
      groups.set(category, (groups.get(category) ?? 0) + 1)
    }

    const list = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, count]) => `${category} (${count})`)
      .join(", ")
    const total = skills.length === 1 ? "1 skill is" : `${skills.length} skills are`
    const matches = searchSkills(message ?? "", skills)
    const likely = matches.length
      ? [
          "Likely matches for this request:",
          ...matches.map(
            (skill) =>
              `- ${skill.name}: ${skill.description.slice(0, 120)}${skill.description.length > 120 ? "..." : ""}`,
          ),
        ]
      : []
    const invoked = invokedSkills(message, skills)
    // The loop loads an invoked skill before the first step, so by the time
    // the model reads this the instructions are already in the transcript;
    // the block binds the work to them.
    const invoke = invoked.length
      ? [
          "<slash-skill-invocation>",
          `The user explicitly invoked ${invoked.map((name) => `/${name}`).join(", ")}. ${invoked.length === 1 ? "Its instructions have been loaded into this conversation" : "Their instructions have been loaded into this conversation"}: follow ${invoked.length === 1 ? "that skill's" : "those skills'"} workflow for the surrounding request, load ${invoked.map((name) => `skill({name:"${name}"})`).join(" and ")} yourself only if no loaded skill result for it is present, and treat these explicit skills as the complete requested workflow scope: do not add likely matches or routing-table skills unless a loaded skill names a required dependency.`,
          "</slash-skill-invocation>",
        ]
      : []

    return publish(
      [
        "<available-skills>",
        `${total} callable across: ${list}.`,
        ...(invoked.length ? [] : likely),
        invoked.length
          ? "Use only the explicitly invoked skills for this request unless one of their loaded instructions names a required dependency."
          : 'Load a likely match by its listed exact name. If no exact name is known or the shortlist is insufficient, use skill({query:"<focused task>"}) and load a returned exact name. Browse a category only when category browsing is useful. Do not invent names from task descriptions or static routing tables.',
        "</available-skills>",
        ...invoke,
      ].join("\n"),
    )
  }

  /** The curated core in the order a research task tends to need it. Every
   * other core skill follows alphabetically, so a new core skill shows up
   * without a code change. */
  const CORE_ORDER = [
    "research-lookup",
    "literature-review",
    "brainstorming",
    "hypotheses",
    "reproduce",
    "autoresearch",
    "compute",
    "execution-hygiene",
    "delegation",
    "figures",
    "scientific-visualization",
    "schematics",
    "generate-image",
    "paper-writing",
    "ml-paper-writing",
    "citations",
    "peer-review",
    "sources",
  ]

  /** Library categories worth naming in the index so a provider or database
   * skill is one exact-name load away, without a search. */
  const CORE_POINTERS: Array<{ category: string; when: string; limit: number }> = [
    { category: "cloud-compute", when: "GPU or cloud provider setup; check compute_job targets first", limit: 12 },
    { category: "databases", when: "a biological, chemical, clinical or scholarly database", limit: 12 },
  ]

  /**
   * The always-present skill index for Research: one line per core skill,
   * then the two library categories that a task may need by exact name.
   * Bodies are never preloaded; the model loads a skill when it applies.
   */
  export async function coreSkills(permission: PermissionNext.Ruleset) {
    return [
      "<core-skills>",
      "BioHelix skills can be invoked via slash commands (e.g. /skill-name) or loaded on-demand using skill({name}).",
      "</core-skills>",
    ].join("\n")
  }

  /** The one line that stops a model treating its training-time frontier as
   * the present: the catalog's cutoff, the gap to today, and where the gap
   * bites (choosing a model, version, baseline or protocol). It is fixed for
   * the day, so it sits in the cached system prompt beside the date. */
  export function cutoff(knowledge: string | undefined, now = new Date()) {
    const parsed = knowledge ? new Date(/^\d{4}-\d{2}$/.test(knowledge) ? `${knowledge}-15` : knowledge) : undefined
    const known = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined
    const months = known ? Math.max(0, Math.round((now.getTime() - known.getTime()) / (30.44 * 86_400_000))) : undefined
    const gap =
      months === undefined
        ? ""
        : months < 1
          ? ", within the last month"
          : `, about ${months} month${months === 1 ? "" : "s"} before today`
    const head = known
      ? `Knowledge cutoff: ${knowledge} (per the model catalog)${gap}.`
      : "Knowledge cutoff: not listed for this model; assume it is months before today."
    return `${head} Models, libraries, methods and results released since are not in your training: look up the current generation before pinning a model, version, baseline or protocol, and read "latest" in a dated source as of its date.`
  }

  export async function environment(
    model: { api: { id: string }; providerID: string; knowledge?: string },
    sessionID: string,
    /** Lines the harness units add inside <env>: compute, time budget, spend. */
    extra: string[] = [],
  ) {
    const project = Instance.project
    const filesystem = await SessionFilesystem.snapshot(sessionID).catch(() => null)
    const workspace = filesystem?.workspace?.scratchRoot ?? Instance.directory
    const projectName = project?.name?.trim() || "BioHelix Project"
    return [
      [
        `<env>`,
        `  Project: ${projectName}`,
        `  Tool working directory: ${workspace}`,
        `  Platform: ${process.platform}`,
        `  Today's date: ${new Date().toDateString()}`,
        `  ${await ImageRoute.line()}`,
        ...extra.map((line) => `  ${line}`),
        `</env>`,
      ].join("\n"),
    ]
  }
}
