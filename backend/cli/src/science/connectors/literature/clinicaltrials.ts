import type { Connector, ConnectorHit } from "../types"
import { getJSON } from "../http"
import { raw, snippet } from "./shared"

/**
 * ClinicalTrials.gov API v2 connector.
 * Provides access to human clinical research study protocols, conditions,
 * interventions, recruitment status, and findings worldwide.
 */

const BASE = "https://clinicaltrials.gov/api/v2/studies"
const RATE_LIMIT = { minIntervalMs: 250 }

interface StudyProtocol {
  protocolSection?: {
    identificationModule?: {
      nctId?: string
      briefTitle?: string
      officialTitle?: string
      organization?: { fullName?: string }
    }
    statusModule?: {
      overallStatus?: string
      startDateStruct?: { date?: string }
      completionDateStruct?: { date?: string }
    }
    descriptionModule?: {
      briefSummary?: string
    }
    conditionsModule?: {
      conditions?: string[]
    }
    designModule?: {
      studyType?: string
      phases?: string[]
    }
    armsInterventionsModule?: {
      interventions?: Array<{ name?: string; type?: string }>
    }
  }
}

interface StudiesResponse {
  studies?: StudyProtocol[]
}

export const clinicaltrials: Connector = {
  id: "clinicaltrials",
  name: "ClinicalTrials.gov",
  domain: "literature",
  description: "Worldwide database of clinical trials, clinical study protocols, interventions, and outcomes.",
  homepage: "https://clinicaltrials.gov",

  async search(query, opts) {
    const size = Math.min(opts?.limit ?? 10, 50)
    const url = `${BASE}?query.term=${encodeURIComponent(query)}&pageSize=${size}`
    const data = await getJSON<StudiesResponse>(url, {
      signal: opts?.signal,
      rateLimit: RATE_LIMIT,
    })

    const studies = data.studies ?? []
    return studies.map<ConnectorHit>((study) => {
      const idModule = study.protocolSection?.identificationModule
      const statusModule = study.protocolSection?.statusModule
      const descModule = study.protocolSection?.descriptionModule
      const condModule = study.protocolSection?.conditionsModule
      const nctId = idModule?.nctId ?? "Unknown"
      const status = statusModule?.overallStatus ?? ""
      const conditions = (condModule?.conditions ?? []).join(", ")
      const summaryParts = [status ? `[${status}]` : "", conditions, descModule?.briefSummary]
        .filter(Boolean)
        .join(" - ")

      return {
        id: nctId,
        title: snippet(idModule?.briefTitle || idModule?.officialTitle, 300) ?? nctId,
        summary: snippet(summaryParts, 500),
        url: `https://clinicaltrials.gov/study/${nctId}`,
        extra: raw(study),
      }
    })
  },

  async fetch(id, opts) {
    const nctId = id.toUpperCase().trim()
    const url = `${BASE}/${encodeURIComponent(nctId)}`
    const study = await getJSON<StudyProtocol>(url, {
      signal: opts?.signal,
      rateLimit: RATE_LIMIT,
    })

    const idModule = study.protocolSection?.identificationModule
    const statusModule = study.protocolSection?.statusModule
    const descModule = study.protocolSection?.descriptionModule
    const designModule = study.protocolSection?.designModule
    const conditions = study.protocolSection?.conditionsModule?.conditions ?? []
    const interventions = study.protocolSection?.armsInterventionsModule?.interventions ?? []

    return {
      nctId,
      title: idModule?.officialTitle || idModule?.briefTitle,
      sponsor: idModule?.organization?.fullName,
      status: statusModule?.overallStatus,
      studyType: designModule?.studyType,
      phases: designModule?.phases,
      conditions,
      interventions,
      summary: descModule?.briefSummary,
      url: `https://clinicaltrials.gov/study/${nctId}`,
      raw: study,
    }
  },
}
