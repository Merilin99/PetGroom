-- Σχήμα βάσης δεδομένων PetGroom
-- Παράγεται από το domain model (βλ. ERD στο README.md):
--   User 1--N Pet, Pet 1--N Appointment,
--   Service 1--N Appointment, User(groomer) 1--N Appointment

USE petgroom;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  role          ENUM('CUSTOMER', 'GROOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id   INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  species    ENUM('DOG', 'CAT', 'OTHER') NOT NULL DEFAULT 'DOG',
  breed      VARCHAR(100),
  size       ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pets_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE services (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  duration_min INT UNSIGNED NOT NULL,
  base_price   DECIMAL(8, 2) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE appointments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pet_id     INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  groomer_id INT UNSIGNED NOT NULL,
  starts_at  DATETIME NOT NULL,
  ends_at    DATETIME NOT NULL,
  status     ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_pet FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services (id),
  CONSTRAINT fk_appt_groomer FOREIGN KEY (groomer_id) REFERENCES users (id),
  -- επιταχύνει τον έλεγχο επικάλυψης ραντεβού ανά groomer κατά την κράτηση
  INDEX idx_appt_groomer_time (groomer_id, starts_at, ends_at)
);
