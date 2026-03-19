CREATE DATABASE IF NOT EXISTS mydearplanner;
USE mydearplanner;

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    dueDate DATE,
    course VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    instructor VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    time VARCHAR(50),
    day VARCHAR(50),
    type VARCHAR(50)
);

-- Insert dummy data
INSERT INTO tasks (id, title, completed, dueDate, course) VALUES 
('1', 'Read Chapter 4: Enterprise Integration Patterns', false, '2026-03-20', 'EAI'),
('2', 'Submit Monolith Assignment', false, '2026-03-22', 'EAI'),
('3', 'Prepare for Midterm Exam', true, '2026-03-15', 'Software Engineering');

INSERT INTO courses (id, name, code, instructor) VALUES 
('1', 'Enterprise Application Integration', 'CS401', 'Prof. Smith'),
('2', 'Software Engineering', 'CS302', 'Dr. Johnson');

INSERT INTO schedules (id, title, time, day, type) VALUES 
('1', 'EAI Lecture', '09:00', 'Monday', 'Class'),
('2', 'SE Lab', '13:00', 'Monday', 'Lab');
