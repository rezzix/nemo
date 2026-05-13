-- Seed data for Nemo (idempotent — safe to run on every startup)

-- Default task types
MERGE INTO task_type (id, name) KEY(id) VALUES (1, 'Project Management');
MERGE INTO task_type (id, name) KEY(id) VALUES (2, 'Tech Lead');
MERGE INTO task_type (id, name) KEY(id) VALUES (3, 'Architecture');
MERGE INTO task_type (id, name) KEY(id) VALUES (4, 'Development');
MERGE INTO task_type (id, name) KEY(id) VALUES (5, 'Data Analysis');
MERGE INTO task_type (id, name) KEY(id) VALUES (6, 'Testing');

-- Default task statuses
MERGE INTO task_status (id, name, category, is_default) KEY(id) VALUES (1, 'To Do', 'TODO', TRUE);
MERGE INTO task_status (id, name, category, is_default) KEY(id) VALUES (2, 'In Progress', 'IN_PROGRESS', FALSE);
MERGE INTO task_status (id, name, category, is_default) KEY(id) VALUES (3, 'Done', 'DONE', FALSE);
MERGE INTO task_status (id, name, category, is_default) KEY(id) VALUES (4, 'Closed', 'CLOSED', FALSE);