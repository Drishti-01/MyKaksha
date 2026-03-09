const DEFAULT_STUDY_DATA = {
  goals: [],
  goalStats: {},
};

export async function fetchStudyData() {
  const response = await fetch("/api/study-data");
  if (!response.ok) {
    throw new Error(`Failed to fetch study data (${response.status})`);
  }

  const data = await response.json();
  return {
    goals: Array.isArray(data.goals) ? data.goals : DEFAULT_STUDY_DATA.goals,
    goalStats: data.goalStats && typeof data.goalStats === "object" ? data.goalStats : DEFAULT_STUDY_DATA.goalStats,
  };
}

export async function saveStudyData(payload) {
  const response = await fetch("/api/study-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to save study data (${response.status})`);
  }
}

export { DEFAULT_STUDY_DATA };
