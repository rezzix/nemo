import { useEffect, useState } from 'react';
import type { ProjectDto, TaskDto } from '@/types';
import { listProjects } from '@/api/projects';
import { getMyTasks } from '@/api/tasks';
import { useAuthStore } from '@/stores/authStore';

export function useMyTasks() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [myTasks, setMyTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetch() {
      try {
        setIsLoading(true);
        const [projs, allTasks] = await Promise.all([
          listProjects(),
          getMyTasks(),
        ]);
        if (cancelled) return;
        if (!cancelled) {
          setProjects(projs);
          setMyTasks(allTasks);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [user]);

  return { projects, myTasks, isLoading };
}
