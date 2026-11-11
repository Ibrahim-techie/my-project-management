import { useEffect, useState } from "react";
import { api, unwrap } from "../api";

/*
 * Cross-project task lists, built from the per-project endpoints the API
 * already has. Each task gains `projectId` and `projectName` so lists can
 * label and link it. Both return null while loading.
 */

const tag = (project) => (t) => ({ ...t, projectId: project._id, projectName: project.name });

function useAcrossProjects(projects, pathFor, deps) {
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    if (!projects) return;
    let live = true;
    Promise.all(
      projects.map(({ project }) =>
        api
          .get(pathFor(project))
          .then((res) => (Array.isArray(unwrap(res)) ? unwrap(res) : []).map(tag(project)))
          .catch(() => []),
      ),
    ).then((lists) => {
      if (live) setTasks(lists.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    });
    return () => {
      live = false;
    };
    // pathFor is rebuilt every render; deps carries what it depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, ...deps]);

  return tasks;
}

/** Tasks assigned to `userId` in every project, most recently updated first. */
export function useMyTasks(projects, userId) {
  return useAcrossProjects(projects, (p) => `/task/${p._id}/users/${userId}`, [userId]);
}

/** Every task in every project, most recently updated first. */
export function useAllTasks(projects) {
  return useAcrossProjects(projects, (p) => `/task/${p._id}`, []);
}
