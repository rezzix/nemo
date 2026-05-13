package com.nemo.documentation;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.task.Task;
import com.nemo.task.TaskRepository;
import com.nemo.project.Project;
import com.nemo.project.ProjectRepository;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WikiPageService {

    private final WikiPageRepository wikiPageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public WikiPageService(WikiPageRepository wikiPageRepository, ProjectRepository projectRepository,
                           UserRepository userRepository, TaskRepository taskRepository) {
        this.wikiPageRepository = wikiPageRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<WikiPage> getPageTree(Long projectId) {
        return wikiPageRepository.findByProjectIdAndParentIdIsNullOrderByPosition(projectId);
    }

    @Transactional(readOnly = true)
    public List<WikiPage> getChildren(Long parentId) {
        return wikiPageRepository.findByParentIdOrderByPosition(parentId);
    }

    @Transactional(readOnly = true)
    public WikiPage getById(Long id) {
        return wikiPageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("WikiPage", id));
    }

    @Transactional
    public WikiPage create(Long projectId, WikiPageDto.CreateRequest request, Long authorId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new EntityNotFoundException("User", authorId));

        WikiPage page = new WikiPage();
        page.setTitle(request.title());
        page.setContent(request.content());
        page.setSlug(generateSlug(request.title()));
        page.setProject(project);
        page.setAuthor(author);

        if (request.parentId() != null) {
            WikiPage parent = wikiPageRepository.findById(request.parentId())
                    .orElseThrow(() -> new EntityNotFoundException("WikiPage", request.parentId()));
            page.setParent(parent);
        }

        if (request.linkedTaskIds() != null) {
            for (Long taskId : request.linkedTaskIds()) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new EntityNotFoundException("Task", taskId));
                page.getLinkedTasks().add(task);
            }
        }

        return wikiPageRepository.save(page);
    }

    @Transactional
    public WikiPage update(Long id, WikiPageDto.UpdateRequest request) {
        WikiPage page = getById(id);

        if (request.title() != null) {
            page.setTitle(request.title());
            page.setSlug(generateSlug(request.title()));
        }
        if (request.content() != null) page.setContent(request.content());
        if (request.parentId() != null) {
            if (request.parentId() == 0 || request.parentId().equals(id)) {
                page.setParent(null);
            } else {
                WikiPage parent = wikiPageRepository.findById(request.parentId())
                        .orElseThrow(() -> new EntityNotFoundException("WikiPage", request.parentId()));
                page.setParent(parent);
            }
        }
        if (request.linkedTaskIds() != null) {
            page.getLinkedTasks().clear();
            for (Long taskId : request.linkedTaskIds()) {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new EntityNotFoundException("Task", taskId));
                page.getLinkedTasks().add(task);
            }
        }

        return wikiPageRepository.save(page);
    }

    @Transactional
    public void delete(Long id) {
        WikiPage page = getById(id);
        wikiPageRepository.delete(page);
    }

    @Transactional
    public WikiPage updatePosition(Long id, WikiPageDto.PositionRequest request) {
        WikiPage page = getById(id);
        page.setPosition(request.position());
        if (request.parentId() != null) {
            WikiPage parent = wikiPageRepository.findById(request.parentId())
                    .orElseThrow(() -> new EntityNotFoundException("WikiPage", request.parentId()));
            page.setParent(parent);
        }
        return wikiPageRepository.save(page);
    }

    @Transactional(readOnly = true)
    public List<WikiPage> search(Long projectId, String q) {
        return wikiPageRepository.search(projectId, q);
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}