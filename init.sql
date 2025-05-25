-- `init.sql`

-- Create Database
CREATE DATABASE IF NOT EXISTS turns_db;
USE turns_db;

-- Table: `document_type`
CREATE TABLE IF NOT EXISTS `document_type` (
  `id_document_type` CHAR(2) NOT NULL PRIMARY KEY,
  `name_document_type` VARCHAR(50)
);

-- Table: `person`
CREATE TABLE IF NOT EXISTS `person` (
  `id_person` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `document_number_person` VARCHAR(20) UNIQUE,
  `id_document_type` CHAR(2) NOT NULL,
  `first_name_person` VARCHAR(50),
  `last_name_person` VARCHAR(50),
  `phone_number_person` VARCHAR(10),
  `birthdate_person` DATE,
  `created_person_by` INT,
  `created_person_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_person_by` INT,
  `updated_person_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_document_type`) REFERENCES `document_type`(`id_document_type`)
);

-- Table: `role_user`
CREATE TABLE IF NOT EXISTS `role_user` (
  `id_role_user` CHAR(3) NOT NULL PRIMARY KEY,
  `name_role_user` VARCHAR(20),
  `created_role_user_by` INT,
  `created_role_user_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: `user`
CREATE TABLE IF NOT EXISTS `user` (
  `id_user` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_person` INT UNIQUE,
  `document_number_person` VARCHAR(20),
  `id_role_user` CHAR(3),
  `name_user` VARCHAR(50),
  `email_user` VARCHAR(100) UNIQUE,
  `password_user` VARCHAR(255),
  `creation_date_user` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_person`) REFERENCES `person`(`id_person`),
  FOREIGN KEY (`id_role_user`) REFERENCES `role_user`(`id_role_user`)
);

-- Table: `user_status`
CREATE TABLE IF NOT EXISTS `user_status` (
  `id_user_status` CHAR(3) NOT NULL PRIMARY KEY,
  `name_user_status` VARCHAR(20),
  `description_user_status` VARCHAR(100)
);

-- Table: `history_user_status`
CREATE TABLE IF NOT EXISTS `history_user_status` (
  `id_history` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_user_status` CHAR(3),
  `old_user` INT,
  `date_hour_userstatus` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_hiuserstatus_by` INT,
  `created_hiuserstatus_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_hiuserstatus_by` INT,
  `updated_hiuserstatus_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reason_status_change` VARCHAR(50),
  FOREIGN KEY (`id_user_status`) REFERENCES `user_status`(`id_user_status`)
);

-- Table: `feedback`
CREATE TABLE IF NOT EXISTS `feedback` (
  `id_feedback` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_user` INT,
  `rating` TINYINT,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`)
);

-- Table: `user_audit`
CREATE TABLE IF NOT EXISTS `user_audit` (
  `id_useraudit` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_user` INT,
  `type_change_useraudit` CHAR(6),
  `change_useraudit_by` INT,
  `change_useraudit_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `changed_useraudit_field` VARCHAR(50),
  `before_value` VARCHAR(50),
  `new_value` VARCHAR(50),
  FOREIGN KEY (`id_user`) REFERENCES `user`(`id_user`)
);

-- Table: `emergency_contact`
CREATE TABLE IF NOT EXISTS `emergency_contact` (
  `id_emecont` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `full_name_emecont` VARCHAR(50),
  `relationship_emecont` ENUM('Parent', 'Sibling', 'Spouse', 'Friend', 'Other'),
  `phone_number_emecont` VARCHAR(15)
);

-- Table: `eps` (Entidad Promotora de Salud)
CREATE TABLE IF NOT EXISTS `eps` (
  `id_eps` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name_eps` VARCHAR(50)
);

-- Table: `allergy`
CREATE TABLE IF NOT EXISTS `allergy` (
  `id_allergy` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name_allergy` VARCHAR(100)
);

-- Table: `inscription_detail`
CREATE TABLE IF NOT EXISTS `inscription_detail` (
  `id_insdetail` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_estu` INT, -- Assuming this is a student ID, might need clarification if `id_user` is student. For now, assuming it's a foreign key to `user` table.
  `id_estatment_u` VARCHAR(5), -- This looks like an ID for `estatement_u` table.
  `student_code` VARCHAR(10),
  `id_emecont` INT,
  `id_eps` INT,
  `blood_type` CHAR(3),
  `id_allergy` INT,
  `url_consent` VARCHAR(500),
  `created_at_insdetail` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_estu`) REFERENCES `user`(`id_user`), -- Assuming student is a user
  FOREIGN KEY (`id_emecont`) REFERENCES `emergency_contact`(`id_emecont`),
  FOREIGN KEY (`id_eps`) REFERENCES `eps`(`id_eps`),
  FOREIGN KEY (`id_allergy`) REFERENCES `allergy`(`id_allergy`)
);

-- Table: `estatement_u`
CREATE TABLE IF NOT EXISTS `estatement_u` (
  `id_estatment_u` VARCHAR(5) NOT NULL PRIMARY KEY,
  `name_estatment_u` VARCHAR(20)
);

-- Table: `inscription_detail_audit`
CREATE TABLE IF NOT EXISTS `inscription_detail_audit` (
  `audit_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `insdetail_id` INT,
  `change_type` ENUM('INSERT', 'UPDATE', 'DELETE'),
  `changed_instdetaud_by` INT,
  `change_instdetaud_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `old_id_estatment_u` VARCHAR(5),
  `new_id_estatment_u` VARCHAR(5),
  `old_student_code` VARCHAR(10),
  `new_student_code` VARCHAR(10),
  `old_id_emecont` INT,
  `new_id_emecont` INT,
  `old_id_eps` INT,
  `new_id_eps` INT,
  `old_blood_type` CHAR(3),
  `new_blood_type` CHAR(3),
  `old_url_consent` VARCHAR(100),
  `new_url_consent` VARCHAR(100),
  FOREIGN KEY (`insdetail_id`) REFERENCES `inscription_detail`(`id_insdetail`),
  FOREIGN KEY (`old_id_estatment_u`) REFERENCES `estatement_u`(`id_estatment_u`),
  FOREIGN KEY (`new_id_estatment_u`) REFERENCES `estatement_u`(`id_estatment_u`),
  FOREIGN KEY (`old_id_emecont`) REFERENCES `emergency_contact`(`id_emecont`),
  FOREIGN KEY (`new_id_emecont`) REFERENCES `emergency_contact`(`id_emecont`),
  FOREIGN KEY (`old_id_eps`) REFERENCES `eps`(`id_eps`),
  FOREIGN KEY (`new_id_eps`) REFERENCES `eps`(`id_eps`)
);

-- Table: `prescription_medication`
CREATE TABLE IF NOT EXISTS `prescription_medication` (
  `id_presmed` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name_presmed` VARCHAR(100),
  `dose_persmed` VARCHAR(50),
  `recipe_reason` VARCHAR(255)
);

-- Table: `inscripdetail_presmed` (Junction table)
CREATE TABLE IF NOT EXISTS `inscripdetail_presmed` (
  `id_insdetail` INT NOT NULL,
  `id_presmed` INT NOT NULL,
  PRIMARY KEY (`id_insdetail`, `id_presmed`),
  FOREIGN KEY (`id_insdetail`) REFERENCES `inscription_detail`(`id_insdetail`),
  FOREIGN KEY (`id_presmed`) REFERENCES `prescription_medication`(`id_presmed`)
);

-- Table: `turn`
CREATE TABLE IF NOT EXISTS `turn` (
  `id_turn` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `max_capacity` INT,
  `day` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'), -- Based on ENUM in schema [cite: 2]
  `status` ENUM('active', 'inactive'), -- Based on ENUM in schema [cite: 2]
  `start_time` TIME,
  `end_time` TIME,
  `created_turn_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_turn_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `color_turn` VARCHAR(30) -- Added based on schema [cite: 3]
);

-- Table: `schedule`
CREATE TABLE IF NOT EXISTS `schedule` (
  `id_schedule` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date_schedule` DATETIME,
  `id_student` INT,
  `id_turn` INT,
  `state_schedule` ENUM('pending', 'confirmed', 'cancelled', 'completed'), -- Assuming common states for a schedule
  `created_schedule_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_schedule_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_student`) REFERENCES `user`(`id_user`), -- Assuming student is a user
  FOREIGN KEY (`id_turn`) REFERENCES `turn`(`id_turn`)
);

-- Table: `reservation_date_history`
CREATE TABLE IF NOT EXISTS `reservation_date_history` (
  `id_history` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `reservation_date` DATE,
  `updated_by` INT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);