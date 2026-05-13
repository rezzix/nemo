import { useEffect, useState } from 'react';
import type { ProjectDto, TaskDto } from '@/types';
import { listProjects } from '@/api/projects';
import { listProjectTasks } from '@/api/tasks';
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
        const projs = await listProjects();
        if (cancelled) return;

        const allTasks: TaskDto[] = [];
        await Promise.all(
          projs.map(async (p) => {
            const tasks = await listProjectTasks(p.id, { assigneeId: user!.id });
            allTasks.push(...tasks);
          }),
        );

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