-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3308
-- Generation Time: Jan 16, 2026 at 03:15 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `uep_sports_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_ath_status`
--

DROP TABLE IF EXISTS `tbl_ath_status`;
CREATE TABLE IF NOT EXISTS `tbl_ath_status` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `person_id` int NOT NULL,
  `scholarship_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`status_id`),
  KEY `fk_status_person` (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_ath_status`
--

INSERT INTO `tbl_ath_status` (`status_id`, `person_id`, `scholarship_name`, `semester`, `school_year`) VALUES
(1, 1, 'Varsity', '1st Sem', '2025-2026'),
(2, 2, 'Varsity', '1st Sem', '2025-2026'),
(3, 10, 'Varsity', '1st Sem', '2025-2026'),
(4, 11, 'Varsity', '1st Sem', '2025-2026'),
(5, 9, 'Trainee', '1st Sem', '2025-2026'),
(6, 51, 'Varsity', '1st Sem', '2025-2026'),
(7, 52, 'Varsity', '1st Sem', '2025-2026'),
(8, 53, 'Varsity', '1st Sem', '2025-2026'),
(9, 54, 'Varsity', '1st Sem', '2025-2026'),
(10, 55, 'Varsity', '1st Sem', '2025-2026'),
(11, 56, 'Varsity', '1st Sem', '2025-2026'),
(12, 57, 'Varsity', '1st Sem', '2025-2026'),
(13, 58, 'Varsity', '1st Sem', '2025-2026'),
(14, 59, 'Varsity', '1st Sem', '2025-2026'),
(15, 60, 'Varsity', '1st Sem', '2025-2026'),
(16, 74, 'varsity', '1', '2024-2025'),
(18, 77, 'varsity', '1', '2024-2025'),
(19, 78, 'varsity', '2', '2024-2025'),
(22, 81, 'varsity', '1', '2024-2025'),
(23, 82, 'varsity', '1', '2024-2025'),
(24, 84, 'varsity', '2', '2023-2024'),
(25, 85, 'varsity', '2', '2023-2024'),
(26, 120, 'Varsity', '', '2026'),
(27, 131, 'Varsity', '', '2026'),
(28, 135, 'Varsity', '1st Semester', '2026'),
(29, 136, 'Varsity', '1st Semester', '2026'),
(30, 137, 'Varsity', '2nd Semester', '2026'),
(31, 138, 'Academic', '1st Semester', '2026'),
(32, 139, 'Varsity', '1st Semester', '2026'),
(33, 152, 'Athletic', '1st Semester', '2025-2026'),
(34, 153, 'Varsity', '1st Semester', '2025-2026'),
(35, 154, 'varsity', '1', '2024-2025'),
(36, 155, 'Varsity', '1st Semester', '2025-2026'),
(37, 156, 'Athletic', '1st Semester', '2025-2026'),
(38, 157, 'Athletic', '1st Semester', '2025-2026'),
(39, 158, 'trainee', '1', '2025-2026'),
(40, 161, 'trainee', '1', '2026-2027'),
(41, 162, 'Varsity', '1st Semester', '2025-2026'),
(42, 165, 'Academic', '1st Semester', '2025-2026'),
(43, 173, 'Academic', '1st Semester', '2025-2026');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_college`
--

DROP TABLE IF EXISTS `tbl_college`;
CREATE TABLE IF NOT EXISTS `tbl_college` (
  `college_id` int NOT NULL AUTO_INCREMENT,
  `college_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_dean` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`college_id`),
  UNIQUE KEY `college_code` (`college_code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_college`
--

INSERT INTO `tbl_college` (`college_id`, `college_code`, `college_name`, `college_dean`, `description`, `is_active`) VALUES
(1, 'CICS', 'College of Information and Computing Sciences', 'Dr. Jose R.', 'IT and Computing programs', 0),
(2, 'CAS', 'College of Arts and Sciences', 'Dr. Lina G.', 'Arts and Sciences', 0),
(3, 'CBA', 'COLLEGE OF BUSINESS ADMINISTRATION', 'Dr. Allan C.', 'Business programs', 1),
(4, 'COED', 'COLLEGE OF EDUCATION', 'Dr. Fe V.', 'Teacher education', 1),
(5, 'CAF', 'College of Agriculture and Fisheries', 'Dr. Mario S.', 'Agriculture and Fisheries', 0),
(6, 'CS', 'COLLEGE OF SCIENCE', 'Ultra', 'Try', 1),
(7, 'CAFNR', 'COLLEGE OF AGRICULTURE, FISHERIES, & NATURAL RESOURCES', '', 'UEP-MAIN COLLEGE', 1),
(8, 'CAC', 'COLLEGE OF ARTS & COMMUNICATION', '', '', 1),
(10, 'CVM', 'COLLEGE OF VETERINARY MEDICINE', '', '', 1),
(11, 'CNAHS', 'COLLEGE OF NURSING & ALLIED HEALTH SCIENCES', '', '', 1),
(12, 'CE', 'COLLEGE OS ENGINEERING', '', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_comp_score`
--

DROP TABLE IF EXISTS `tbl_comp_score`;
CREATE TABLE IF NOT EXISTS `tbl_comp_score` (
  `competetors_score_id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `match_id` int NOT NULL,
  `team_id` int DEFAULT NULL COMMENT 'NULL for individual sports',
  `athlete_id` int DEFAULT NULL COMMENT 'NULL for team sports',
  `score` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Flexible score field - can store formatted scores',
  `rank_no` int DEFAULT NULL,
  `medal_type` enum('Gold','Silver','Bronze','None') COLLATE utf8mb4_unicode_ci DEFAULT 'None',
  PRIMARY KEY (`competetors_score_id`),
  KEY `fk_score_tour` (`tour_id`),
  KEY `fk_score_team` (`team_id`),
  KEY `fk_score_athlete` (`athlete_id`),
  KEY `idx_match_competitor` (`match_id`,`team_id`,`athlete_id`)
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_comp_score`
--

INSERT INTO `tbl_comp_score` (`competetors_score_id`, `tour_id`, `match_id`, `team_id`, `athlete_id`, `score`, `rank_no`, `medal_type`) VALUES
(1, 1, 1, 1, 1, '25.00', 1, 'Gold'),
(2, 1, 1, 2, 2, '18.00', 2, 'Silver'),
(3, 1, 2, 3, 10, '30.00', 1, 'Gold'),
(4, 3, 4, 3, 11, '22.00', 1, 'Gold'),
(5, 2, 3, 1, 1, '24.00', 1, 'Gold'),
(7, 21, 20, 13, 55, '25.00', 1, 'Gold'),
(8, 21, 20, 15, 61, '23.00', 2, 'Silver'),
(9, 21, 19, 14, 58, '25.00', 3, 'Bronze'),
(17, 21, 34, NULL, NULL, '6.00', 5, 'Gold'),
(23, 21, 43, NULL, NULL, '6.00', 3, 'Gold'),
(24, 21, 43, NULL, NULL, '23.00', 2, 'Gold'),
(25, 21, 43, NULL, NULL, '23.00', 2, 'Bronze'),
(26, 28, 46, 40, NULL, '3.00', 2, 'Silver'),
(27, 28, 47, NULL, NULL, '2.00', 1, 'Gold'),
(28, 28, 50, NULL, 147, NULL, NULL, NULL),
(29, 28, 50, NULL, 149, NULL, NULL, NULL),
(30, 28, 51, NULL, 147, NULL, NULL, NULL),
(31, 28, 51, NULL, 149, NULL, NULL, NULL),
(32, 28, 50, NULL, NULL, '3.00', 1, 'Gold'),
(34, 28, 48, NULL, NULL, '4.00', 1, 'Silver'),
(35, 28, 53, 39, NULL, '25.00', 1, 'Gold'),
(36, 28, 52, NULL, NULL, '5.00', 1, 'Gold'),
(37, 28, 55, NULL, NULL, '3.00', 3, 'Silver'),
(38, 28, 56, NULL, NULL, '23.00', 3, 'Gold'),
(39, 28, 57, NULL, NULL, '2.00', 2, 'Gold'),
(40, 28, 57, NULL, NULL, '3.00', 2, 'Silver'),
(41, 28, 48, NULL, NULL, '2.00', 3, 'Gold'),
(43, 28, 53, 42, NULL, '3.00', 3, 'Silver'),
(44, 28, 59, 39, NULL, '3.00', 3, 'Silver'),
(45, 28, 59, 42, NULL, '4.00', 4, 'Gold'),
(46, 28, 62, NULL, 149, '2.00', 3, 'Gold'),
(47, 28, 61, NULL, 147, '23:04.003', 3, 'Gold'),
(48, 28, 48, NULL, 147, '23:05.021', 2, 'Silver'),
(49, 28, 54, NULL, 147, '34:43.032', 2, 'Gold'),
(50, 28, 63, 39, NULL, '23-23-22-0-0', 3, 'Gold'),
(51, 28, 65, 39, NULL, '23-20-23-0-0', 3, 'Silver'),
(52, 28, 63, 40, NULL, '23-24-23-2-2', 2, 'Silver'),
(53, 28, 60, NULL, 149, '2:03.002', 2, 'Gold'),
(54, 28, 55, NULL, 147, '23:03.003', 3, 'Silver'),
(55, 28, 52, NULL, 147, '23:34.032', 1, 'Gold'),
(65, 28, 67, 39, NULL, '25-25-25-25-25', 2, 'Gold'),
(66, 28, 68, 39, NULL, '2-2-2-2-2', 2, 'Silver'),
(67, 28, 69, 42, NULL, '24-23-25-0-0', 2, 'Gold'),
(68, 28, 69, 39, NULL, '25-25-25-25-0', 2, 'Silver'),
(69, 28, 70, 40, NULL, '1-1-1-1-1', 2, 'Silver'),
(70, 28, 72, 39, NULL, '1-2-3-4-5', 1, 'Silver'),
(71, 28, 70, 42, NULL, '3-3-3-3-3', 3, 'Bronze'),
(72, 28, 72, 40, NULL, '23-22-25-25-23', 1, 'Silver'),
(73, 28, 73, 42, NULL, '3-4-3-4-3', 1, NULL),
(74, 28, 73, 39, NULL, '5-6-23-24-25', 2, NULL),
(75, 28, 74, 42, NULL, '30-30-30-30-30', 1, 'Gold'),
(76, 28, 64, 39, NULL, '5-5-5-5-5', 2, 'Silver'),
(77, 28, 71, 39, NULL, '6-6-6-6-6', 3, 'Silver'),
(78, 28, 58, 42, NULL, '21-21-21-21-21', 1, 'Silver'),
(79, 28, 66, 42, NULL, '2-3-2-3-2', 2, 'Gold'),
(80, 28, 75, 42, NULL, '1-1-1-1-1', 2, 'Silver'),
(81, 28, 75, 39, NULL, '2-2-2-2-2', 3, 'Silver'),
(82, 28, 76, 42, NULL, '4-4-4-4-4', 2, 'Gold'),
(83, 28, 76, 39, NULL, '5-5-5-5-5', 2, 'Gold'),
(85, 28, 77, 40, NULL, '2-3-4-5-6', 1, 'Gold'),
(86, 28, 77, 42, NULL, '4-5-6-7-8', 2, 'Silver'),
(87, 28, 80, 39, NULL, '25-25-25-25-25', 1, NULL),
(88, 28, 80, 40, NULL, '20-20-20-20-20', 2, NULL),
(89, 28, 81, 39, NULL, '25-25-25-25-25', 1, 'Gold'),
(90, 28, 81, 42, NULL, '10-10-10-10-10', 2, 'Silver'),
(91, 28, 82, NULL, 62, '0.00 (T:0.0 M:0.0 C:0.0)', 1, 'Gold'),
(92, 28, 82, NULL, 165, '0.00 (T:0.0 M:0.0 C:0.0)', 2, 'Silver'),
(93, 28, 82, NULL, 152, '0.00 (T:0.0 M:0.0 C:0.0)', 3, 'Bronze'),
(94, 28, 82, NULL, 156, '0.00 (T:0.0 M:0.0 C:0.0)', 4, NULL),
(96, 28, 84, NULL, 156, '3.25 (T:2.0 M:2.0 C:4.0 P:5.0)', 1, NULL),
(97, 28, 84, NULL, 62, '5.50 (T:5.0 M:7.0 C:7.0 P:3.0)', 1, NULL),
(98, 28, 84, NULL, 152, '3.50 (T:4.0 M:3.0 C:3.0 P:4.0)', 2, NULL),
(99, 28, 85, NULL, 165, '4.50 (T:3.0 M:4.0 C:5.0 P:6.0)', 1, 'Gold'),
(100, 28, 85, NULL, 62, '9.00 (T:9.0 M:9.0 C:9.0 P:9.0)', 1, 'Gold'),
(101, 28, 86, 42, NULL, '23-23-25-23-0', 1, 'Gold'),
(102, 28, 86, 39, NULL, '24-23-23-23-20', 2, 'Silver'),
(103, 28, 87, 39, NULL, '0-0-0-0-0', 1, 'Gold'),
(104, 28, 87, 40, NULL, '4-4-4-4-4', 2, 'Silver'),
(105, 28, 88, 39, NULL, '24-24-24-24-24', 1, 'Gold'),
(106, 28, 88, 42, NULL, '25-25-25-25-25', 2, 'Silver'),
(107, 28, 89, 39, NULL, '23-23-23-23-23', 1, 'Gold'),
(108, 28, 89, 42, NULL, '24-24-24-25-25', 2, 'Silver'),
(116, 28, 90, 42, NULL, '2-2-3-2-1', 2, 'Silver'),
(117, 28, 90, 39, NULL, '4-3-20-23-21', 1, 'Gold'),
(118, 28, 94, 42, NULL, '3-3-3-3-3', 2, NULL),
(119, 28, 94, 39, NULL, '3-3-4-3-3', 1, NULL),
(125, 28, 97, 39, NULL, '3-23-24-3-4', 1, 'Gold'),
(126, 28, 97, 40, NULL, '3-4-5-4-2', 2, 'Silver'),
(127, 28, 98, 39, NULL, '3-3-1-2-3', 1, 'Gold'),
(128, 28, 98, 42, NULL, '2-3-2-1-1', 2, 'Silver'),
(133, 28, 101, NULL, 149, '5:03.005', 1, 'Gold'),
(134, 28, 101, NULL, 155, '5:06.006', 2, 'Silver'),
(135, 28, 102, 40, NULL, '2-23-23-25-9', 1, 'Gold'),
(136, 28, 102, 42, NULL, '23-25-25-22-5', 2, 'Silver'),
(137, 28, 103, 39, NULL, '0-0-1-2-3', 2, 'Silver'),
(138, 28, 103, 42, NULL, '3-23-23-21-23', 1, 'Gold'),
(139, 28, 104, 39, NULL, '1-1-1-1-1', 1, NULL),
(140, 28, 104, 40, NULL, '2-4-4-2-2', 2, NULL),
(141, 28, 105, 42, NULL, '20-20-21-20-23', 2, 'Silver'),
(142, 28, 105, 40, NULL, '25-25-25-25-25', 1, 'Gold'),
(143, 28, 107, 39, NULL, '23-23-23-23-23', 1, NULL),
(144, 28, 107, 42, NULL, '24-24-23-23-24', 2, NULL),
(145, 28, 106, 40, NULL, '23-23-23-23-23', 2, 'Silver'),
(146, 28, 106, 39, NULL, '24-23-23-23-23', 1, 'Gold'),
(147, 28, 108, 40, NULL, '23-21-21-21-21', 2, 'Bronze'),
(148, 28, 108, 39, NULL, '24-22-23-21-21', 1, NULL),
(149, 28, 110, NULL, 62, '5.25 (T:7.0 M:6.0 C:5.0 P:3.0)', 1, 'Gold'),
(150, 28, 110, NULL, 165, '4.00 (T:3.0 M:5.0 C:3.0 P:5.0)', 2, 'Silver'),
(151, 28, 112, NULL, 149, '5:05.003', 5, NULL),
(152, 28, 112, NULL, 147, '5:04.003', 4, NULL),
(153, 28, 112, NULL, 158, '3:02.003', 3, 'Bronze'),
(154, 28, 112, NULL, 155, '2:03.001', 1, 'Gold'),
(155, 28, 112, NULL, 157, '2:03.002', 2, 'Silver'),
(156, 28, 113, NULL, 165, '4.50 (T:3.0 M:4.0 C:5.0 P:6.0)', 2, 'Bronze'),
(157, 28, 113, NULL, 156, '4.50 (T:3.0 M:4.0 C:5.0 P:6.0)', 1, NULL),
(158, 28, 113, NULL, 152, '3.75 (T:6.0 M:3.0 C:5.0 P:1.0)', 3, NULL),
(159, 28, 114, NULL, 152, '3.25 (T:4.0 M:3.0 C:5.0 P:1.0)', 3, 'Bronze'),
(160, 28, 114, NULL, 156, '5.00 (T:3.0 M:5.0 C:8.0 P:4.0)', 1, 'Gold'),
(161, 28, 114, NULL, 62, '4.25 (T:4.0 M:7.0 C:1.0 P:5.0)', 2, 'Silver'),
(162, 28, 115, 39, NULL, '23-23-22-21-23', 1, 'Bronze'),
(163, 28, 115, 42, NULL, '24-24-23-23-25', 2, NULL),
(164, 28, 116, 42, NULL, '24-21-21-23-21', 2, NULL),
(165, 28, 116, 39, NULL, '25-25-24-24-23', 1, 'Bronze'),
(166, 28, 117, 40, NULL, '23-21-20-23-23', 2, 'Silver'),
(167, 28, 117, 39, NULL, '23-22-24-23-22', 1, 'Gold'),
(168, 28, 118, NULL, 149, '4:03.002', 5, NULL),
(169, 28, 118, NULL, 155, '3:02.005', 3, 'Bronze'),
(170, 28, 118, NULL, 157, '2:03.001', 1, 'Gold'),
(171, 28, 118, NULL, 158, '3:02.001', 2, 'Silver'),
(172, 28, 118, NULL, 147, '3:02.008', 4, NULL),
(173, 28, 119, NULL, 165, '3.75 (T:3.0 M:3.0 C:4.0 P:5.0)', 3, 'Bronze'),
(174, 28, 119, NULL, 62, '4.25 (T:5.0 M:1.0 C:5.0 P:6.0)', 2, 'Silver'),
(175, 28, 119, NULL, 152, '6.75 (T:5.0 M:6.0 C:8.0 P:8.0)', 1, 'Gold'),
(176, 28, 120, 41, NULL, '7-8-9 (1-1-1-6-20-7-4-5-0)', 1, 'Gold'),
(177, 28, 120, 40, NULL, '5-4-3 (7-0-7-0-9-7-6-0-6)', 2, 'Silver'),
(178, 28, 121, NULL, 149, '3 (2 moves) [undefined]', 1, NULL),
(179, 28, 121, NULL, 62, '3 (4 moves) [undefined]', 2, NULL),
(180, 28, 122, 42, NULL, '2-3-21-12-23', 2, 'Silver'),
(181, 28, 122, 39, NULL, '22-21-22-21-1', 1, 'Gold');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_course`
--

DROP TABLE IF EXISTS `tbl_course`;
CREATE TABLE IF NOT EXISTS `tbl_course` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `course_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept_id` int NOT NULL,
  `course_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `num_years` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`course_id`),
  UNIQUE KEY `course_code` (`course_code`),
  KEY `fk_course_dept` (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_course`
--

INSERT INTO `tbl_course` (`course_id`, `course_code`, `course_name`, `dept_id`, `course_type`, `num_years`, `description`) VALUES
(1, 'BSIT', 'Bachelor of Science in Information Technology', 1, 'Undergraduate', 4, 'UEP BSIT Program'),
(2, 'BSCS', 'Bachelor of Science in Computer Science', 2, 'Undergraduate', 4, 'UEP BSCS Program'),
(3, 'BAENG', 'Bachelor of Arts in English', 3, 'Undergraduate', 4, 'UEP BA English Program'),
(4, 'BSMATH', 'Bachelor of Science in Mathematics', 4, 'Undergraduate', 4, 'UEP BS Math Program'),
(5, 'BPE', 'Bachelor of Physical Education', 5, 'Undergraduate', 4, 'UEP BPE Program');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_database_backups`
--

DROP TABLE IF EXISTS `tbl_database_backups`;
CREATE TABLE IF NOT EXISTS `tbl_database_backups` (
  `backup_id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filepath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `backup_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`backup_id`),
  KEY `created_by` (`created_by`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_database_backups`
--

INSERT INTO `tbl_database_backups` (`backup_id`, `filename`, `filepath`, `filesize`, `created_at`, `created_by`, `backup_type`, `description`, `is_deleted`) VALUES
(1, 'backup_uep_sports_management_2026-01-15_13-26-16.sql', 'C:\\wamp64\\www\\vms_complete\\system_administrator/../backups/backup_uep_sports_management_2026-01-15_13-26-16.sql', 138283, '2026-01-15 13:26:17', 22, 'manual', 'Manual backup created by administrator', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_department`
--

DROP TABLE IF EXISTS `tbl_department`;
CREATE TABLE IF NOT EXISTS `tbl_department` (
  `dept_id` int NOT NULL AUTO_INCREMENT,
  `dept_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dept_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` int NOT NULL,
  `dept_head` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`dept_id`),
  KEY `fk_dept_college` (`college_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_department`
--

INSERT INTO `tbl_department` (`dept_id`, `dept_code`, `dept_name`, `college_id`, `dept_head`, `description`, `is_active`) VALUES
(1, 'IT', 'Information Technology', 1, 'Mr. Bryan C.', 'IT Department', 1),
(2, 'CS', 'Computer Science', 1, 'Ms. Ana D.', 'CS Department', 1),
(3, 'ENG', 'English', 2, 'Ms. Joy P.', 'English Department', 1),
(4, 'MATH', 'Mathematics', 2, 'Mr. Ryan L.', 'Math Department', 1),
(5, 'PE', 'Physical Education', 4, 'Mr. Carlo R.', 'PE Department', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_equip_inventory`
--

DROP TABLE IF EXISTS `tbl_equip_inventory`;
CREATE TABLE IF NOT EXISTS `tbl_equip_inventory` (
  `inv_id` int NOT NULL AUTO_INCREMENT,
  `equip_id` int NOT NULL,
  `trans_type` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transdate` datetime NOT NULL,
  `trans_by` int DEFAULT NULL,
  `rec_rel_by` int DEFAULT NULL,
  `equip_cond` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`inv_id`),
  KEY `fk_inv_transby` (`trans_by`),
  KEY `fk_inv_recrelby` (`rec_rel_by`),
  KEY `idx_inventory_equip` (`equip_id`,`transdate` DESC),
  KEY `idx_inventory_type` (`trans_type`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_equip_inventory`
--

INSERT INTO `tbl_equip_inventory` (`inv_id`, `equip_id`, `trans_type`, `transdate`, `trans_by`, `rec_rel_by`, `equip_cond`, `quantity`) VALUES
(1, 1, 'in', '2025-01-05 09:00:00', 5, 1, 'New', 1),
(2, 2, 'in', '2025-01-05 09:30:00', 5, 2, 'New', 1),
(3, 1, 'out', '2025-01-10 07:00:00', 8, 3, 'Good', 1),
(4, 3, 'out', '2025-01-10 07:10:00', 8, 12, 'Good', 1),
(5, 4, 'out', '2025-01-10 08:00:00', 7, 4, 'Good', 1),
(16, 5, 'out', '2026-01-09 12:19:33', 10, 5, 'Good', 1),
(17, 3, 'in', '2026-01-09 12:19:39', 10, 5, 'Good', 16),
(19, 13, 'in', '2026-01-09 12:24:51', 10, 5, 'Good', 1),
(20, 1, 'in', '2026-01-09 12:44:05', 10, 5, 'Good', 4),
(21, 4, 'in', '2026-01-09 12:44:15', 10, 5, 'Good', 7),
(22, 5, 'in', '2026-01-09 12:44:24', 10, 5, 'Good', 6),
(23, 14, 'in', '2026-01-09 13:06:20', 10, 5, 'Good', 15),
(24, 3, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(25, 14, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(26, 14, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(27, 14, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(28, 14, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(29, 14, 'out', '2026-01-09 13:18:35', 3, 3, 'Good', 1),
(30, 3, 'out', '2026-01-09 20:12:16', 144, 144, 'Good', 1),
(31, 13, 'out', '2026-01-09 21:05:34', 144, 144, 'Good', 1),
(32, 2, 'out', '2026-01-09 22:39:26', 142, 142, 'Good', 1),
(33, 3, 'out', '2026-01-09 22:39:26', 142, 142, 'Good', 1),
(34, 5, 'out', '2026-01-09 22:39:26', 142, 142, 'Good', 1),
(35, 13, 'out', '2026-01-09 22:39:26', 142, 142, 'Good', 1),
(36, 2, 'out', '2026-01-11 01:12:55', 143, 143, 'Good', 1),
(37, 14, 'out', '2026-01-11 01:12:55', 143, 143, 'Good', 1),
(38, 2, 'out', '2026-01-11 01:26:41', 144, 144, 'Good', 1),
(39, 5, 'out', '2026-01-11 01:26:41', 144, 144, 'Good', 1),
(40, 2, 'out', '2026-01-11 01:40:10', 144, 144, 'Good', 1),
(41, 1, 'out', '2026-01-11 01:40:10', 144, 144, 'Good', 1),
(42, 2, 'out', '2026-01-11 09:47:39', 143, 143, 'Good', 1),
(43, 15, 'in', '2026-01-12 02:04:44', 10, 5, 'Good', 3),
(44, 16, 'in', '2026-01-12 02:06:22', 10, 5, 'Good', 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_game_venue`
--

DROP TABLE IF EXISTS `tbl_game_venue`;
CREATE TABLE IF NOT EXISTS `tbl_game_venue` (
  `venue_id` int NOT NULL AUTO_INCREMENT,
  `venue_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_building` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_room` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`venue_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_game_venue`
--

INSERT INTO `tbl_game_venue` (`venue_id`, `venue_name`, `venue_building`, `venue_room`, `venue_description`, `is_active`) VALUES
(1, 'UEP Gymnasium', 'Main Campus', 'GYM', 'Main indoor venue for tournaments', 0),
(2, 'UEP Covered Court', 'Main Campus', 'CC-1', 'Covered court for team sports', 1),
(3, 'Laoang Campus Court', 'Laoang Campus', 'COURT', 'Outdoor court (Laoang)', 1),
(4, 'Catubig Campus Court', 'Catubig Campus', 'COURT', 'Outdoor court (Catubig)', 1),
(5, 'UEP Track Oval', 'Main Campus', 'OVAL', 'Track and field venue', 1),
(6, 'UEP Gym', 'Main Gym', 'Court A', 'Indoor court', 1),
(7, 'UEP Gymna', 'Main Gym', 'Court B', 'Indoor court', 1),
(8, 'Open Field', 'Sports Complex', 'Field 1', 'Football field', 1),
(9, 'Badminton Hall', 'Sports Complex', 'Court 1', 'Badminton court', 1),
(10, 'Badminton Hall', 'Sports Complex', 'Court 2', 'Badminton court', 1),
(11, 'Table Tennis Hall', 'Sports Complex', 'TT1', 'Table tennis area', 1),
(12, 'Track Oval', 'Sports Complex', 'Oval', 'Running track', 1),
(13, 'Chess Hall', 'CAS Building', 'Room 101', 'Chess competition room', 1),
(14, 'Sepak Court', 'Sports Complex', 'Court S', 'Takraw court', 1),
(15, 'Softball Field', 'Sports Complex', 'Field S', 'Softball field', 1),
(16, 'Talolora', '2', '23', NULL, 1),
(17, 'Pangpang', '21', '23', 'Try langs', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_logs`
--

DROP TABLE IF EXISTS `tbl_logs`;
CREATE TABLE IF NOT EXISTS `tbl_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `log_event` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_table` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `old_data` text COLLATE utf8mb4_unicode_ci,
  `new_data` text COLLATE utf8mb4_unicode_ci,
  `can_revert` tinyint(1) DEFAULT '0',
  `reverted_at` datetime DEFAULT NULL,
  `reverted_by` int DEFAULT NULL,
  `log_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`log_id`),
  KEY `fk_logs_user` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_target` (`target_table`,`target_id`),
  KEY `idx_can_revert` (`can_revert`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_logs`
--

INSERT INTO `tbl_logs` (`log_id`, `user_id`, `log_event`, `action_type`, `target_table`, `target_id`, `old_data`, `new_data`, `can_revert`, `reverted_at`, `reverted_by`, `log_date`, `module_name`) VALUES
(1, 1, 'Created new tournament record', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-01-10 10:00:00', 'Tournament Management'),
(2, 2, 'Assigned teams to tournament', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-01-10 11:00:00', 'Team Management'),
(3, 3, 'Created training schedule', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-01-15 09:00:00', 'Training Management'),
(4, 4, 'Confirmed match officiating', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-02-10 08:30:00', 'Tournament Management'),
(5, 5, 'Recorded match scores', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-02-10 12:00:00', 'Tournament Management'),
(6, 3, 'Coach Peter Cruz added new player: Belly Joe Garin', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-03 12:06:08', 'Team Management'),
(7, 3, 'Coach Peter Cruz added new player: Jeremy Oladive', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-03 12:15:35', 'Team Management'),
(8, 3, 'Coach Peter Cruz added new player: Marky Oladive', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-03 12:21:31', 'Team Management'),
(9, 3, 'Coach Peter Cruz added new player: Marcelina Sami', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-03 12:41:35', 'Team Management'),
(10, 3, 'Coach Peter Cruz added new player: Jodel Barcelona', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-03 12:45:39', 'Team Management'),
(11, 3, 'Coach Peter Cruz added new player: MARK XAVIER GARIN', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-04 01:21:22', 'Team Management'),
(12, 3, 'Coach Peter Cruz added new player: LENIEL GARIN', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-04 21:08:32', 'Team Management'),
(13, 22, 'Created sport: Mobile Legends', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-04 21:36:56', 'System Administration'),
(14, 22, 'Deleted tournament', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-05 20:56:11', 'System Administration'),
(15, 22, 'Created user: athlete_francine (athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 14:53:16', 'System Administration'),
(16, 22, 'Created user: admin_noel (admin)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 14:54:55', 'System Administration'),
(17, 22, 'Created user: tournament_manager_noel (Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 14:55:47', 'System Administration'),
(18, 516, 'Created user: admin_maricel (admin)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 15:00:28', 'System Administration'),
(19, 518, 'Created user: spectator_niel (Spectator)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 15:08:21', 'System Administration'),
(20, 22, 'Created user: tournament_manager_indoy (tournament_manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:21:19', 'System Administration'),
(21, 22, 'Created user: tournament_manager_belly (Role Type: Tournament manager, User Role: tournament_manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:31:08', 'System Administration'),
(22, 22, 'Created user: athlete_bien (Role Type: athlete/player, User Role: athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:40:51', 'System Administration'),
(23, 22, 'Updated user: tournament_manager_belly (Role Type: Tournament manager, User Role: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:44:09', 'System Administration'),
(24, 22, 'Updated user: tournament_manager_indoy (Role Type: Tournament manager, User Role: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:44:20', 'System Administration'),
(25, 22, 'Created sport: League of Legends', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:46:21', 'System Administration'),
(26, 22, 'Created user: spectator_rose (Role Type: Spectator, User Role: Spectator)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 19:48:41', 'System Administration'),
(27, 22, 'Created user: spectator_ariel (Role Type: athlete/player, User Role: athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 20:16:52', 'System Administration'),
(28, 22, 'Created user: umpire_herba (Role Type: umpire, User Role: umpire)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 20:19:55', 'System Administration'),
(29, 22, 'Created user: tournament_manager_merlita (Role Type: Tournament manager, User Role: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 20:23:12', 'System Administration'),
(30, 22, 'Updated user: mark_user', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 20:41:09', 'System Administration'),
(31, 22, 'Updated user: tm_belly joe', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 20:41:19', 'System Administration'),
(32, 22, 'Created user: tour_noel (Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 21:07:03', 'System Administration'),
(33, 22, 'Created user: athlete_mercy (athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 21:09:02', 'System Administration'),
(34, 22, 'Created user: athlete_marnie (athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 21:59:56', 'System Administration'),
(35, 22, 'Created user: althlete_nona (Role: athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-06 23:54:10', 'System Administration'),
(36, 22, 'Created user: trainor_mercedes (Role: trainor)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:01:09', 'System Administration'),
(37, 22, 'Created user: admin_marcelo (Role: trainor)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:04:31', 'System Administration'),
(38, 22, 'Created user: tour_maricar (Role: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:05:46', 'System Administration'),
(39, 22, 'Created user: tour_karding (Role: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:18:02', 'System Administration'),
(40, 22, 'Created user: coach_macky (Role: coach)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:19:27', 'System Administration'),
(41, 22, 'Created user: spectator_karding (Role: Spectator)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:21:14', 'System Administration'),
(42, 22, 'Created user: director_mafi (Role: sports director)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:22:42', 'System Administration'),
(43, 22, 'Created user: director_true (Role: sports director)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:26:34', 'System Administration'),
(44, 22, 'Created user: athlete_bella (Role: athlete/player)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:28:46', 'System Administration'),
(45, 22, 'Created user: director_nexy (Role: sports director, Access: sports_director)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:38:10', 'System Administration'),
(46, 22, 'Created user: manager_sipa (Role: Tournament manager, Access: Tournament manager)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 00:39:39', 'System Administration'),
(47, 22, 'Updated user: director_nexy', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 05:54:17', 'System Administration'),
(48, 22, 'Updated user: director_nexy', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 05:54:33', 'System Administration'),
(49, 22, 'Updated user: director_nexy', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 05:59:04', 'System Administration'),
(50, 22, 'Updated user: director_nexy', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 05:59:19', 'System Administration'),
(51, 22, 'Updated user: director_true', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 06:16:33', 'System Administration'),
(52, 22, 'Updated user: director_nexy', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-07 06:16:48', 'System Administration'),
(53, 44, 'Disqualified athlete (team_ath_id: 58). Reason: Try', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-08 16:59:23', 'Tournament Management'),
(54, 22, '[system administrator] Pres Ultra created new user account \'tournament_manager_sheen\' with role type \'tournament_manager\' and system access as \'Tournament manager\' for SHEEN GARIN from college \'CBA\'', 'create', 'tbl_users', 544, NULL, '{\"user_id\":\"544\",\"person_id\":\"140\",\"username\":\"tournament_manager_sheen\",\"user_role\":\"Tournament manager\",\"person_data\":{\"f_name\":\"SHEEN\",\"l_name\":\"GARIN\",\"m_name\":\"JOE P.\",\"role_type\":\"tournament_manager\",\"title\":\"Mrs\",\"date_birth\":\"2026-01-22\",\"college_code\":\"CBA\",\"course\":\"BSCS\",\"blood_type\":\"AB-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 16:17:16', 'User Management'),
(55, 22, '[system administrator] Pres Ultra created new user account \'manager_geriane\' with role type \'tournament_manager\' and system access as \'Tournament manager\' for Jose Ariel Geriane from college \'CS\'', 'create', 'tbl_users', 545, NULL, '{\"user_id\":\"545\",\"person_id\":\"141\",\"username\":\"manager_geriane\",\"user_role\":\"Tournament manager\",\"person_data\":{\"f_name\":\"Jose Ariel\",\"l_name\":\"Geriane\",\"m_name\":null,\"role_type\":\"tournament_manager\",\"title\":\"Mr\",\"date_birth\":\"2004-08-24\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:13:34', 'User Management'),
(56, 22, '[system administrator] Pres Ultra created new user account \'coach_gatongay\' with role type \'coach\' and system access as \'coach\' for Riva Gatongay from college \'CS\'', 'create', 'tbl_users', 546, NULL, '{\"user_id\":\"546\",\"person_id\":\"142\",\"username\":\"coach_gatongay\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"Riva\",\"l_name\":\"Gatongay\",\"m_name\":null,\"role_type\":\"coach\",\"title\":\"Mrs\",\"date_birth\":\"2026-01-17\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:25:32', 'User Management'),
(57, 22, '[system administrator] Pres Ultra created new user account \'coach_masloc\' with role type \'coach\' and system access as \'coach\' for Danilo Masloc from college \'CAF\'', 'create', 'tbl_users', 547, NULL, '{\"user_id\":\"547\",\"person_id\":\"143\",\"username\":\"coach_masloc\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"Danilo\",\"l_name\":\"Masloc\",\"m_name\":null,\"role_type\":\"coach\",\"title\":\"Mr\",\"date_birth\":\"2026-01-14\",\"college_code\":\"CAF\",\"course\":\"BSIT\",\"blood_type\":\"AB+\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:26:13', 'User Management'),
(58, 22, '[system administrator] Pres Ultra created new user account \'coach_chan\' with role type \'coach\' and system access as \'coach\' for Celeste Chan from college \'CS\'', 'create', 'tbl_users', 548, NULL, '{\"user_id\":\"548\",\"person_id\":\"144\",\"username\":\"coach_chan\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"Celeste\",\"l_name\":\"Chan\",\"m_name\":null,\"role_type\":\"coach\",\"title\":\"Mrs\",\"date_birth\":\"2026-01-15\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"AB+\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:45:55', 'User Management'),
(59, 22, '[system administrator] Pres Ultra created new user account \'athlete_are\' with role type \'athlete\' and system access as \'athlete/player\' for Mj Are from college \'CS\'', 'create', 'tbl_users', 549, NULL, '{\"user_id\":\"549\",\"person_id\":\"145\",\"username\":\"athlete_are\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"Mj\",\"l_name\":\"Are\",\"m_name\":null,\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"AB-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:48:00', 'User Management'),
(60, 22, '[system administrator] Pres Ultra created new user account \'coach_ching\' with role type \'coach\' and system access as \'coach\' for Jose Ching from college \'CS\'', 'create', 'tbl_users', 550, NULL, '{\"user_id\":\"550\",\"person_id\":\"146\",\"username\":\"coach_ching\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"Jose\",\"l_name\":\"Ching\",\"m_name\":null,\"role_type\":\"coach\",\"title\":\"Mr\",\"date_birth\":\"2026-01-14\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"AB+\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:49:37', 'User Management'),
(61, 22, '[system administrator] Pres Ultra created new user account \'athlete_balang\' with role type \'athlete\' and system access as \'athlete/player\' for Rossep Balang from college \'CS\'', 'create', 'tbl_users', 551, NULL, '{\"user_id\":\"551\",\"person_id\":\"147\",\"username\":\"athlete_balang\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"Rossep\",\"l_name\":\"Balang\",\"m_name\":null,\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:51:06', 'User Management'),
(62, 22, '[system administrator] Pres Ultra created new user account \'manager_benesisto\' with role type \'tournament_manager\' and system access as \'Tournament manager\' for Rogelio Benesisto from college \'CS\'', 'create', 'tbl_users', 552, NULL, '{\"user_id\":\"552\",\"person_id\":\"148\",\"username\":\"manager_benesisto\",\"user_role\":\"Tournament manager\",\"person_data\":{\"f_name\":\"Rogelio\",\"l_name\":\"Benesisto\",\"m_name\":null,\"role_type\":\"tournament_manager\",\"title\":\"Mr\",\"date_birth\":\"2026-01-20\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:54:50', 'User Management'),
(63, 22, '[system administrator] Pres Ultra created new user account \'athlete_carpio\' with role type \'athlete\' and system access as \'athlete/player\' for Daniel Carpio from college \'CS\'', 'create', 'tbl_users', 553, NULL, '{\"user_id\":\"553\",\"person_id\":\"149\",\"username\":\"athlete_carpio\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"Daniel\",\"l_name\":\"Carpio\",\"m_name\":null,\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-14\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"AB+\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 19:59:09', 'User Management'),
(64, 22, '[system administrator] Pres Ultra created new user account \'athlete_lopez\' with role type \'athlete\' and system access as \'athlete/player\' for Cairon Lopez from college \'CS\'', 'create', 'tbl_users', 554, NULL, '{\"user_id\":\"554\",\"person_id\":\"150\",\"username\":\"athlete_lopez\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"Cairon\",\"l_name\":\"Lopez\",\"m_name\":null,\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-20\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-09 20:01:56', 'User Management'),
(65, 546, 'Coach Riva Gatongay added new player: BELLY GARIN', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-10 02:06:52', 'Team Management'),
(66, 545, 'Disqualified athlete (team_ath_id: 77). Reason: try', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-11 20:58:48', 'Tournament Management'),
(67, 556, 'New athlete account created: Francine Baldoza', 'CREATE', 'tbl_users', 556, NULL, '{\"username\":\"athlete_francine1\",\"user_role\":\"athlete\\/player\",\"person_id\":\"156\"}', 0, NULL, NULL, '2026-01-11 21:15:15', 'User Management'),
(68, 557, 'New athlete account created: Nathaniel De Rosas', 'CREATE', 'tbl_users', 557, NULL, '{\"username\":\"athlete_nathaniel\",\"user_role\":\"athlete\\/player\",\"person_id\":\"157\"}', 0, NULL, NULL, '2026-01-11 21:18:16', 'User Management'),
(69, 557, 'Username changed from \'athlete_nathaniel\' to \'athlete_nathaniel1\'', 'UPDATE', 'tbl_users', 557, '{\"username\":\"athlete_nathaniel\"}', '{\"username\":\"athlete_nathaniel1\"}', 1, NULL, NULL, '2026-01-11 21:41:17', 'User Management'),
(70, 557, 'Password changed for user \'athlete_nathaniel1\'', 'UPDATE', 'tbl_users', 557, NULL, '{\"password_changed\":true,\"timestamp\":\"2026-01-11 13:42:27\"}', 0, NULL, NULL, '2026-01-11 21:42:27', 'User Management'),
(71, 546, 'Coach Riva Gatongay added new player: Mercita Sabellano', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-12 01:58:46', 'Team Management'),
(72, 558, 'Username changed from \'athlete_sabellano\' to \'athlete_sabellano1\'', 'UPDATE', 'tbl_users', 558, '{\"username\":\"athlete_sabellano\"}', '{\"username\":\"athlete_sabellano1\"}', 1, '2026-01-14 17:37:05', 22, '2026-01-12 02:01:18', 'User Management'),
(73, 22, '[system administrator] Pres Ultra created new user account \'umpire_jomei\' with role type \'umpire\' and system access as \'umpire\' for Jomei Custorio from college \'CS\'', 'create', 'tbl_users', 559, NULL, '{\"user_id\":\"559\",\"person_id\":\"159\",\"username\":\"umpire_jomei\",\"user_role\":\"umpire\",\"person_data\":{\"f_name\":\"Jomei\",\"l_name\":\"Custorio\",\"m_name\":\"Nepo\",\"role_type\":\"umpire\",\"title\":\"Mr\",\"date_birth\":\"2026-01-14\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-12 23:27:52', 'User Management'),
(74, 22, '[system administrator] Pres Ultra Sport deactivated', 'deactivated', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 02:56:05', 'System Administration'),
(75, 22, '[system administrator] Pres Ultra Sport deactivated', 'deactivated', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 02:56:11', 'System Administration'),
(76, 22, '[system administrator] Pres Ultra Sport deactivated', 'deactivated', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 02:56:20', 'System Administration'),
(77, 22, '[system administrator] Pres Ultra Sport deactivated', 'deactivated', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 02:56:29', 'System Administration'),
(78, 22, '[system administrator] Pres Ultra Sport deactivated', 'deactivated', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 02:56:35', 'System Administration'),
(79, 22, '[system administrator] Pres Ultra created new user account \'coach_puaso\' with role type \'coach\' and system access as \'coach\' for GERALD PUASO from college \'CS\'', 'create', 'tbl_users', 560, NULL, '{\"user_id\":\"560\",\"person_id\":\"160\",\"username\":\"coach_puaso\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"GERALD\",\"l_name\":\"PUASO\",\"m_name\":\"S\",\"role_type\":\"coach\",\"title\":\"Mr\",\"date_birth\":\"2026-01-23\",\"college_code\":\"CS\",\"course\":\"BSIT\",\"blood_type\":\"AB-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-13 20:24:29', 'User Management'),
(80, 560, 'Coach GERALD PUASO added new player: Mark Garin', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-13 20:38:40', 'Team Management'),
(81, 562, 'New athlete account created: Jomei Custorio', 'CREATE', 'tbl_users', 562, NULL, '{\"username\":\"athlete_jomei\",\"user_role\":\"athlete\\/player\",\"person_id\":\"162\"}', 0, NULL, NULL, '2026-01-13 20:39:58', 'User Management'),
(82, 552, 'Disqualified athlete (team_ath_id: 77). Reason: try', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-14 08:15:41', 'Tournament Management'),
(83, 552, 'Disqualified athlete (team_ath_id: 77). Reason: try', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-14 08:19:51', 'Tournament Management'),
(84, 545, 'Disqualified athlete (team_ath_id: 72). Reason: try', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-14 08:20:58', 'Tournament Management'),
(85, 22, '[system administrator] Pres Ultra reverted action from log #72: \"Username changed from \'athlete_sabellano\' to \'athlete_sabellano1\'\"', 'revert', 'tbl_logs', 72, NULL, NULL, 0, NULL, NULL, '2026-01-14 17:37:05', 'System Administration'),
(86, 22, '[system administrator] Pres Ultra Deleted tournament', 'delete', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-14 20:50:31', 'System Administration'),
(87, 563, 'New athlete account created: MARCEL GARIN', 'CREATE', 'tbl_users', 563, NULL, '{\"username\":\"athlete_marcel\",\"user_role\":\"athlete\\/player\",\"person_id\":\"163\"}', 0, NULL, NULL, '2026-01-14 21:46:48', 'User Management'),
(88, 564, 'New athlete account created: LUCAS GARIN', 'CREATE', 'tbl_users', 564, NULL, '{\"username\":\"athlete_lucas\",\"user_role\":\"athlete\\/player\",\"person_id\":\"164\"}', 0, NULL, NULL, '2026-01-14 21:48:02', 'User Management'),
(89, 565, 'New athlete account created: Jomei Custorio', 'CREATE', 'tbl_users', 565, NULL, '{\"username\":\"athlete_jomei1\",\"user_role\":\"athlete\\/player\",\"person_id\":\"165\"}', 0, NULL, NULL, '2026-01-14 21:49:12', 'User Management'),
(90, 566, 'New athlete account created: Jomei Custorio', 'CREATE', 'tbl_users', 566, NULL, '{\"username\":\"athlete_jomei2\",\"user_role\":\"athlete\\/player\",\"person_id\":\"166\"}', 0, NULL, NULL, '2026-01-14 22:04:59', 'User Management'),
(91, 567, 'New athlete account created: LUNA GARIN', 'CREATE', 'tbl_users', 567, NULL, '{\"username\":\"athlete_luna\",\"user_role\":\"athlete\\/player\",\"person_id\":\"167\"}', 0, NULL, NULL, '2026-01-14 22:05:28', 'User Management'),
(92, 568, 'New athlete account created: LENIEL GARUS', 'CREATE', 'tbl_users', 568, NULL, '{\"username\":\"athlete_leniel\",\"user_role\":\"athlete\\/player\",\"person_id\":\"168\"}', 0, NULL, NULL, '2026-01-15 02:50:57', 'User Management'),
(93, 22, '[system administrator] Pres Ultra Created sport: Volleyball - Womens', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:10:27', 'System Administration'),
(94, 22, '[system administrator] Pres Ultra Created sport: Volleyball - Mens', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:13:57', 'System Administration'),
(95, 22, '[system administrator] Pres Ultra Updated sport: Volleyball - Mens', 'update', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:15:00', 'System Administration'),
(96, 22, '[system administrator] Pres Ultra Updated sport: Volleyball - Womens', 'update', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:15:19', 'System Administration'),
(97, 22, '[system administrator] Pres Ultra Created sport: Sepak Takraw - Womens', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:16:02', 'System Administration'),
(98, 22, '[system administrator] Pres Ultra Created sport: Badminton - Men Singles', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:45:22', 'System Administration'),
(99, 22, '[system administrator] Pres Ultra Updated sport: Badminton Doubles - Womens', 'update', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:46:09', 'System Administration'),
(100, 22, '[system administrator] Pres Ultra Created sport: Badminton Single - Womens', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:46:48', 'System Administration'),
(101, 22, '[system administrator] Pres Ultra Updated sport: Badminton Men - Singles', 'update', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:47:07', 'System Administration'),
(102, 22, '[system administrator] Pres Ultra Created sport: Badminton Mens - Double', 'create', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-01-15 09:47:54', 'System Administration'),
(103, 22, '[system administrator] Pres Ultra created database backup: backup_uep_sports_management_2026-01-15_13-26-16.sql (0.13 MB)', 'create', 'tbl_database_backups', 1, NULL, '{\"filename\":\"backup_uep_sports_management_2026-01-15_13-26-16.sql\",\"filesize\":\"0.13 MB\"}', 0, NULL, NULL, '2026-01-15 21:26:17', 'Database Management'),
(104, 22, '[system administrator] Pres Ultra created new user account \'athlete_zed\' with role type \'athlete\' and system access as \'athlete/player\' for ZED TURLA from college \'COED\'', 'create', 'tbl_users', 569, NULL, '{\"user_id\":\"569\",\"person_id\":\"169\",\"username\":\"athlete_zed\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"ZED\",\"l_name\":\"TURLA\",\"m_name\":\"M\",\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"COED\",\"course\":\"BPE\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-15 21:34:31', 'User Management'),
(105, 22, '[system administrator] Pres Ultra created new user account \'coach_zed\' with role type \'coach\' and system access as \'coach\' for DAR TURLA from college \'COED\'', 'create', 'tbl_users', 570, NULL, '{\"user_id\":\"570\",\"person_id\":\"170\",\"username\":\"coach_zed\",\"user_role\":\"coach\",\"person_data\":{\"f_name\":\"DAR\",\"l_name\":\"TURLA\",\"m_name\":\"M\",\"role_type\":\"coach\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"COED\",\"course\":\"BPE\",\"blood_type\":\"A-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-15 21:38:49', 'User Management'),
(106, 22, '[system administrator] Pres Ultra created new user account \'athlete_luke\' with role type \'athlete\' and system access as \'athlete/player\' for LUKE TURLA from college \'COED\'', 'create', 'tbl_users', 571, NULL, '{\"user_id\":\"571\",\"person_id\":\"171\",\"username\":\"athlete_luke\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"LUKE\",\"l_name\":\"TURLA\",\"m_name\":\"M\",\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"COED\",\"course\":null,\"blood_type\":\"AB+\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-15 21:43:24', 'User Management'),
(107, 22, '[system administrator] Pres Ultra created new user account \'manager_kat\' with role type \'tournament_manager\' and system access as \'Tournament manager\' for KAT TURLA from college \'COED\'', 'create', 'tbl_users', 572, NULL, '{\"user_id\":\"572\",\"person_id\":\"172\",\"username\":\"manager_kat\",\"user_role\":\"Tournament manager\",\"person_data\":{\"f_name\":\"KAT\",\"l_name\":\"TURLA\",\"m_name\":\"M\",\"role_type\":\"tournament_manager\",\"title\":\"Mr\",\"date_birth\":null,\"college_code\":\"COED\",\"course\":\"BPE\",\"blood_type\":\"B-\",\"is_active\":1}}', 1, NULL, NULL, '2026-01-15 21:51:05', 'User Management'),
(108, 573, 'New athlete account created: ATE VILLEZAR', 'CREATE', 'tbl_users', 573, NULL, '{\"username\":\"athlete_ate\",\"user_role\":\"athlete\\/player\",\"person_id\":\"173\"}', 0, NULL, NULL, '2026-01-15 21:58:08', 'User Management'),
(109, 22, '[system administrator] Pres Ultra created new user account \'athlete_bryan\' with role type \'athlete\' and system access as \'athlete/player\' for BRYAN TURLA from college \'COED\' and assigned to team', 'create', 'tbl_users', 574, NULL, '{\"user_id\":\"574\",\"person_id\":\"174\",\"username\":\"athlete_bryan\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"BRYAN\",\"l_name\":\"TURLA\",\"m_name\":\"M\",\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"COED\",\"course\":\"BPE\",\"blood_type\":\"AB+\",\"is_active\":1},\"team_assigned\":true}', 1, NULL, NULL, '2026-01-15 22:21:29', 'User Management'),
(110, 22, '[system administrator] Pres Ultra created new user account \'athlete_pomeranda\' with role type \'athlete\' and system access as \'athlete/player\' for John Lee Pomeranda from college \'COED\' and assigned to team', 'create', 'tbl_users', 575, NULL, '{\"user_id\":\"575\",\"person_id\":\"175\",\"username\":\"athlete_pomeranda\",\"user_role\":\"athlete\\/player\",\"person_data\":{\"f_name\":\"John Lee\",\"l_name\":\"Pomeranda\",\"m_name\":\"S\",\"role_type\":\"athlete\",\"title\":\"Mr\",\"date_birth\":\"2026-01-15\",\"college_code\":\"COED\",\"course\":\"BPE\",\"blood_type\":\"B-\",\"is_active\":1},\"team_assigned\":true}', 1, NULL, NULL, '2026-01-15 23:10:58', 'User Management'),
(111, 22, '[system administrator] Pres Ultra permanently deleted tournament \'UEPAA2026\' (2025-2026) and all associated records', 'delete', 'tbl_tournament', 27, '{\"tour_id\":27,\"tour_name\":\"UEPAA2026\",\"school_year\":\"2025-2026\",\"tour_date\":\"2026-01-15\",\"is_active\":0}', NULL, 1, NULL, NULL, '2026-01-16 10:36:38', 'Tournament Management'),
(112, 22, '[system administrator] Pres Ultra permanently deleted tournament \'Balik-Laro\' (2025-2026) and all associated records', 'delete', 'tbl_tournament', 25, '{\"tour_id\":25,\"tour_name\":\"Balik-Laro\",\"school_year\":\"2025-2026\",\"tour_date\":\"2026-01-14\",\"is_active\":0}', NULL, 1, NULL, NULL, '2026-01-16 10:36:44', 'Tournament Management'),
(113, 22, '[system administrator] Pres Ultra activated tournament \'Men Sports Fest\' (2024-2025)', 'activate', 'tbl_tournament', 13, '{\"is_active\":0}', '{\"is_active\":1}', 1, NULL, NULL, '2026-01-16 10:37:10', 'Tournament Management'),
(114, 22, '[system administrator] Pres Ultra deactivated tournament \'Men Sports Fest\' (2024-2025)', 'deactivate', 'tbl_tournament', 13, '{\"is_active\":1}', '{\"is_active\":0}', 1, NULL, NULL, '2026-01-16 10:37:16', 'Tournament Management'),
(115, 22, '[system administrator] Pres Ultra created new tournament \'PALAPAG INTERTOWN\' for school year 2026-2027', 'create', 'tbl_tournament', 30, NULL, '{\"tour_name\":\"PALAPAG INTERTOWN\",\"school_year\":\"2026-2027\",\"tour_date\":\"2026-01-16\",\"is_active\":0}', 1, NULL, NULL, '2026-01-16 10:45:19', 'Tournament Management');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_match`
--

DROP TABLE IF EXISTS `tbl_match`;
CREATE TABLE IF NOT EXISTS `tbl_match` (
  `match_id` int NOT NULL AUTO_INCREMENT,
  `game_no` int NOT NULL,
  `sked_date` date NOT NULL,
  `sked_time` time NOT NULL,
  `venue_id` int NOT NULL,
  `match_umpire_id` int DEFAULT NULL,
  `match_sports_manager_id` int DEFAULT NULL,
  `match_type` enum('EL','QF','SF','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sports_id` int NOT NULL,
  `sports_type` enum('individual','team') COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_a_id` int DEFAULT NULL,
  `team_b_id` int DEFAULT NULL,
  `tour_id` int NOT NULL,
  `winner_team_id` int DEFAULT NULL,
  `winner_athlete_id` int DEFAULT NULL,
  PRIMARY KEY (`match_id`),
  KEY `fk_match_venue` (`venue_id`),
  KEY `fk_match_umpire` (`match_umpire_id`),
  KEY `fk_match_manager` (`match_sports_manager_id`),
  KEY `fk_match_sports` (`sports_id`),
  KEY `fk_match_teama` (`team_a_id`),
  KEY `fk_match_teamb` (`team_b_id`),
  KEY `fk_match_tour` (`tour_id`),
  KEY `fk_match_winner_team` (`winner_team_id`),
  KEY `fk_match_winner_athlete` (`winner_athlete_id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_match`
--

INSERT INTO `tbl_match` (`match_id`, `game_no`, `sked_date`, `sked_time`, `venue_id`, `match_umpire_id`, `match_sports_manager_id`, `match_type`, `sports_id`, `sports_type`, `team_a_id`, `team_b_id`, `tour_id`, `winner_team_id`, `winner_athlete_id`) VALUES
(1, 1, '2025-02-10', '09:00:00', 1, 4, 7, 'EL', 1, 'team', 1, 2, 1, 1, NULL),
(2, 2, '2025-02-10', '11:00:00', 2, 14, 7, 'EL', 2, 'team', 3, 4, 1, 3, NULL),
(3, 3, '2025-03-05', '10:00:00', 3, 4, 7, 'QF', 1, 'team', 1, 5, 2, 1, NULL),
(4, 4, '2025-04-12', '14:00:00', 4, 14, 7, 'SF', 1, 'team', 2, 3, 3, 3, NULL),
(5, 5, '2025-06-15', '08:00:00', 5, 4, 7, 'F', 5, 'individual', NULL, NULL, 5, NULL, NULL),
(6, 1, '2024-03-20', '08:00:00', 1, 3, 1, 'EL', 1, 'team', 1, 2, 1, 2, NULL),
(7, 2, '2024-03-20', '10:00:00', 2, 3, 1, 'EL', 2, 'team', 1, 2, 1, 1, NULL),
(8, 3, '2024-04-12', '09:00:00', 3, 3, 1, 'QF', 3, 'team', 1, 2, 2, 1, NULL),
(9, 4, '2024-05-22', '08:00:00', 4, 3, 1, 'EL', 4, 'individual', NULL, NULL, 3, NULL, NULL),
(10, 5, '2024-06-18', '09:00:00', 5, 3, 1, 'SF', 5, 'individual', NULL, NULL, 4, NULL, NULL),
(11, 6, '2024-07-15', '08:00:00', 6, 3, 1, 'EL', 6, 'individual', NULL, NULL, 5, NULL, NULL),
(16, 0, '2025-12-25', '21:53:00', 8, NULL, NULL, 'QF', 1, 'team', 3, 1, 15, 1, NULL),
(17, 1, '2026-02-15', '09:00:00', 1, 71, 7, 'SF', 1, 'team', 13, 14, 21, 13, NULL),
(18, 2, '2026-02-15', '11:00:00', 1, 72, 7, 'SF', 1, 'team', 15, 16, 21, 15, NULL),
(19, 3, '2026-02-15', '14:00:00', 1, 71, 7, 'QF', 1, 'team', 14, 16, 21, 14, NULL),
(20, 4, '2026-02-15', '16:00:00', 1, 72, 7, 'F', 1, 'team', 13, 15, 21, 13, NULL),
(21, 0, '2026-01-14', '14:30:00', 15, NULL, NULL, 'QF', 1, 'team', 14, 2, 21, 14, NULL),
(22, 0, '2026-01-15', '12:03:00', 13, NULL, NULL, 'EL', 1, 'team', 13, 7, 21, 7, NULL),
(34, 34, '2026-01-22', '12:25:00', 11, 103, NULL, 'QF', 5, 'individual', NULL, NULL, 21, 1, NULL),
(40, 9, '2026-01-24', '12:59:00', 2, 103, NULL, 'QF', 2, 'team', 38, 14, 21, NULL, NULL),
(43, 43, '2026-01-23', '16:04:00', 11, 14, NULL, 'EL', 5, 'individual', NULL, NULL, 21, NULL, 1),
(44, 87, '2026-01-28', '19:43:00', 8, 4, NULL, 'QF', 2, 'team', 38, 14, 21, NULL, NULL),
(45, 49, '2026-01-24', '22:55:00', 16, 4, NULL, 'SF', 2, 'team', 38, 14, 21, NULL, NULL),
(46, 1, '2026-01-21', '20:12:00', 15, 14, NULL, 'EL', 1, 'team', 40, 39, 28, 39, NULL),
(47, 2, '2026-01-15', '17:36:00', 14, 103, NULL, 'EL', 5, 'individual', NULL, NULL, 28, NULL, 149),
(48, 1, '2026-01-14', '14:45:00', 13, 4, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(50, 4, '2026-01-15', '15:12:00', 11, 103, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(51, 5, '2026-01-07', '15:52:00', 6, 4, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 149),
(52, 6, '2026-01-13', '19:02:00', 2, 71, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(53, 7, '2026-01-15', '20:17:00', 16, 103, NULL, 'QF', 1, 'team', 42, 39, 28, 39, NULL),
(54, 7, '2026-01-13', '19:35:00', 16, 4, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(55, 8, '2026-01-14', '18:14:00', 2, 4, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(56, 9, '2026-01-19', '18:23:00', 15, 4, NULL, 'SF', 5, 'individual', NULL, NULL, 28, NULL, 149),
(57, 10, '2026-01-20', '18:35:00', 6, 103, NULL, 'SF', 5, 'individual', NULL, NULL, 28, NULL, 149),
(58, 12, '2026-01-07', '18:59:00', 16, 71, NULL, 'QF', 1, 'team', 40, 42, 28, 42, NULL),
(59, 11, '2026-01-21', '18:02:00', 16, 4, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(60, 12, '2026-01-15', '19:16:00', 16, 14, NULL, 'QF', 5, 'individual', NULL, NULL, 28, NULL, 149),
(61, 13, '2026-01-14', '19:21:00', 6, 14, NULL, 'SF', 5, 'individual', NULL, NULL, 28, NULL, 147),
(62, 50, '2026-01-20', '19:35:00', 3, 103, NULL, 'F', 5, 'individual', NULL, NULL, 28, NULL, 149),
(63, 13, '2026-01-22', '11:36:00', 6, 103, NULL, 'SF', 1, 'team', 40, 39, 28, 40, NULL),
(64, 15, '2026-01-14', '00:54:00', 17, 71, NULL, 'SF', 1, 'team', 39, 42, 28, 39, NULL),
(65, 15, '2026-01-14', '00:56:00', 11, 72, NULL, 'QF', 1, 'team', 39, 42, 28, 42, NULL),
(66, 89, '2026-01-16', '14:28:00', 16, 159, NULL, 'SF', 1, 'team', 39, 42, 28, 42, NULL),
(67, 34, '2026-01-15', '00:24:00', 2, 4, NULL, 'SF', 1, 'team', 40, 39, 28, 39, NULL),
(68, 6, '2026-01-29', '11:07:00', 12, 71, NULL, 'QF', 1, 'team', 39, 42, 28, 39, NULL),
(69, 25, '2026-01-14', '08:04:00', 12, 103, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(70, 26, '2026-01-14', '08:01:00', 6, 103, NULL, 'F', 1, 'team', 42, 40, 28, 40, NULL),
(71, 27, '2026-01-14', '08:31:00', 12, 159, NULL, 'EL', 1, 'team', 42, 39, 28, 42, NULL),
(72, 30, '2026-01-14', '09:12:00', 7, 103, NULL, 'EL', 1, 'team', 39, 40, 28, 40, NULL),
(73, 32, '2026-01-14', '15:38:00', 12, 14, NULL, 'QF', 1, 'team', 42, 39, 28, 42, NULL),
(74, 35, '2026-01-14', '16:07:00', 6, 14, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(75, 36, '2026-01-14', '16:55:00', 12, 14, NULL, 'QF', 1, 'team', 42, 39, 28, 42, NULL),
(76, 36, '2026-01-14', '17:00:00', 12, 14, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(77, 38, '2026-01-14', '17:06:00', 6, 14, NULL, 'F', 1, 'team', 42, 40, 28, 40, NULL),
(80, 38, '2026-01-14', '17:19:00', 6, 103, NULL, 'SF', 1, 'team', 39, 40, 28, 39, NULL),
(81, 39, '2026-01-14', '17:21:00', 2, 14, NULL, 'F', 1, 'team', 42, 39, 28, 39, NULL),
(82, 50, '2026-01-14', '23:19:00', 2, 14, NULL, 'F', 22, 'individual', NULL, NULL, 28, NULL, 62),
(84, 55, '2026-01-14', '23:32:00', 7, 14, NULL, 'QF', 22, 'individual', NULL, NULL, 28, NULL, 62),
(85, 56, '2026-01-14', '23:34:00', 12, 103, NULL, 'F', 22, 'individual', NULL, NULL, 28, NULL, 62),
(86, 87, '2026-01-14', '23:37:00', 7, 103, NULL, 'F', 1, 'team', 42, 39, 28, 42, NULL),
(87, 60, '2026-01-14', '23:41:00', 6, 14, NULL, 'F', 1, 'team', 39, 40, 28, 39, NULL),
(88, 61, '2026-01-14', '23:45:00', 2, 159, NULL, 'F', 1, 'team', 42, 39, 28, 39, NULL),
(89, 63, '2026-01-15', '00:02:00', 2, 103, NULL, 'F', 1, 'team', 42, 39, 28, 39, NULL),
(90, 67, '2026-01-15', '00:17:00', 7, 14, NULL, 'F', 1, 'team', 42, 39, 28, 39, NULL),
(94, 32, '2026-01-15', '00:33:00', 6, 14, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(97, 78, '2026-01-15', '00:40:00', 6, 159, NULL, 'F', 1, 'team', 39, 40, 28, 39, NULL),
(98, 87, '2026-01-15', '00:50:00', 6, 14, NULL, 'F', 1, 'team', 39, 42, 28, 39, NULL),
(101, 3, '2026-01-15', '01:03:00', 2, 14, NULL, 'F', 5, 'individual', NULL, NULL, 28, NULL, 149),
(102, 69, '2026-01-15', '01:04:00', 12, 103, NULL, 'F', 1, 'team', 40, 42, 28, 40, NULL),
(103, 3, '2026-01-15', '01:06:00', 16, 14, NULL, 'F', 1, 'team', 42, 39, 28, 42, NULL),
(104, 45, '2026-01-15', '01:12:00', 12, 103, NULL, 'SF', 1, 'team', 40, 39, 28, 39, NULL),
(105, 34, '2026-01-15', '01:16:00', 12, 14, NULL, 'F', 1, 'team', 42, 40, 28, 40, NULL),
(106, 34, '2026-01-15', '01:17:00', 12, 14, NULL, 'F', 1, 'team', 39, 40, 28, 39, NULL),
(107, 45, '2026-01-15', '01:18:00', 12, 103, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(108, 34, '2026-01-15', '01:28:00', 2, 159, NULL, 'SF', 1, 'team', 40, 39, 28, 39, NULL),
(110, 4, '2026-01-15', '01:32:00', 6, 103, NULL, 'F', 22, 'individual', NULL, NULL, 28, NULL, 62),
(112, 5, '2026-01-15', '01:34:00', 12, 103, NULL, 'F', 5, 'individual', NULL, NULL, 28, NULL, 155),
(113, 7, '2026-01-15', '01:36:00', 12, 14, NULL, 'SF', 22, 'individual', NULL, NULL, 28, NULL, 156),
(114, 45, '2026-01-15', '01:38:00', 12, 14, NULL, 'F', 22, 'individual', NULL, NULL, 28, NULL, 156),
(115, 45, '2026-01-15', '01:41:00', 16, 14, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(116, 8, '2026-01-15', '01:47:00', 2, 103, NULL, 'SF', 1, 'team', 42, 39, 28, 39, NULL),
(117, 5, '2026-01-15', '01:48:00', 12, 14, NULL, 'F', 1, 'team', 40, 39, 28, 39, NULL),
(118, 4, '2026-01-15', '01:50:00', 6, 14, NULL, 'F', 5, 'individual', NULL, NULL, 28, NULL, 157),
(119, 5, '2026-01-15', '01:52:00', 6, 14, NULL, 'F', 22, 'individual', NULL, NULL, 28, NULL, 152),
(120, 35, '2026-01-15', '18:51:00', 12, 14, NULL, 'F', 14, 'team', 41, 40, 28, 41, NULL),
(121, 23, '2026-01-16', '00:19:00', 12, 159, NULL, 'QF', 12, 'individual', NULL, NULL, 28, NULL, 149),
(122, 23, '2026-01-16', '00:25:00', 2, 159, NULL, 'F', 1, 'team', 42, 39, 28, 39, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_match_athletes`
--

DROP TABLE IF EXISTS `tbl_match_athletes`;
CREATE TABLE IF NOT EXISTS `tbl_match_athletes` (
  `match_athlete_id` int NOT NULL AUTO_INCREMENT,
  `match_id` int NOT NULL,
  `athlete_id` int NOT NULL,
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`match_athlete_id`),
  UNIQUE KEY `unique_match_athlete` (`match_id`,`athlete_id`),
  KEY `athlete_id` (`athlete_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_match_participants`
--

DROP TABLE IF EXISTS `tbl_match_participants`;
CREATE TABLE IF NOT EXISTS `tbl_match_participants` (
  `participant_id` int NOT NULL AUTO_INCREMENT,
  `match_id` int NOT NULL,
  `athlete_id` int NOT NULL,
  `team_id` int DEFAULT NULL COMMENT 'Athlete team for reference only',
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('registered','competed','disqualified','absent') COLLATE utf8mb4_unicode_ci DEFAULT 'registered',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`participant_id`),
  UNIQUE KEY `unique_match_athlete` (`match_id`,`athlete_id`),
  KEY `idx_match` (`match_id`),
  KEY `idx_athlete` (`athlete_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks which athletes are registered for individual sport matches';

--
-- Dumping data for table `tbl_match_participants`
--

INSERT INTO `tbl_match_participants` (`participant_id`, `match_id`, `athlete_id`, `team_id`, `registered_at`, `status`, `notes`) VALUES
(1, 52, 147, 40, '2026-01-10 08:02:14', 'competed', NULL),
(2, 52, 149, 39, '2026-01-10 08:02:14', 'registered', NULL),
(3, 54, 149, 39, '2026-01-10 08:35:39', 'registered', NULL),
(4, 54, 147, 40, '2026-01-10 08:35:39', 'competed', NULL),
(5, 55, 149, 39, '2026-01-10 10:12:08', 'registered', NULL),
(6, 55, 147, 40, '2026-01-10 10:12:08', 'competed', NULL),
(7, 56, 149, 39, '2026-01-10 10:20:38', 'registered', NULL),
(8, 56, 147, 40, '2026-01-10 10:20:38', 'registered', NULL),
(9, 57, 149, 39, '2026-01-10 10:31:34', 'registered', NULL),
(10, 57, 147, 40, '2026-01-10 10:31:34', 'competed', NULL),
(11, 60, 149, 39, '2026-01-10 11:13:46', 'competed', NULL),
(12, 60, 147, 40, '2026-01-10 11:13:46', 'registered', NULL),
(13, 61, 149, 39, '2026-01-10 11:18:55', 'registered', NULL),
(14, 61, 147, 40, '2026-01-10 11:18:55', 'competed', NULL),
(15, 62, 149, 39, '2026-01-10 11:33:17', 'competed', NULL),
(16, 62, 147, 40, '2026-01-10 11:33:17', 'registered', NULL),
(25, 82, 62, 41, '2026-01-14 15:20:09', 'competed', NULL),
(26, 82, 156, 41, '2026-01-14 15:20:09', 'competed', NULL),
(27, 82, 165, 40, '2026-01-14 15:20:09', 'competed', NULL),
(28, 82, 152, 40, '2026-01-14 15:20:09', 'competed', NULL),
(32, 84, 62, 41, '2026-01-14 15:33:03', 'competed', NULL),
(33, 84, 156, 41, '2026-01-14 15:33:03', 'competed', NULL),
(34, 84, 152, 40, '2026-01-14 15:33:03', 'competed', NULL),
(35, 85, 62, 41, '2026-01-14 15:35:02', 'competed', NULL),
(36, 85, 165, 40, '2026-01-14 15:35:02', 'competed', NULL),
(37, 85, 152, 40, '2026-01-14 15:35:02', 'registered', NULL),
(56, 101, 149, 39, '2026-01-14 17:03:21', 'competed', NULL),
(57, 101, 155, 39, '2026-01-14 17:03:21', 'competed', NULL),
(62, 110, 62, 41, '2026-01-14 17:32:59', 'competed', NULL),
(63, 110, 165, 40, '2026-01-14 17:32:59', 'competed', NULL),
(66, 112, 149, 39, '2026-01-14 17:34:32', 'competed', NULL),
(67, 112, 155, 39, '2026-01-14 17:34:32', 'competed', NULL),
(68, 112, 158, 42, '2026-01-14 17:34:32', 'competed', NULL),
(69, 112, 157, 39, '2026-01-14 17:34:32', 'competed', NULL),
(70, 112, 147, 40, '2026-01-14 17:34:32', 'competed', NULL),
(71, 113, 156, 41, '2026-01-14 17:36:18', 'competed', NULL),
(72, 113, 165, 40, '2026-01-14 17:36:18', 'competed', NULL),
(73, 113, 152, 40, '2026-01-14 17:36:18', 'competed', NULL),
(74, 114, 62, 41, '2026-01-14 17:38:19', 'competed', NULL),
(75, 114, 156, 41, '2026-01-14 17:38:19', 'competed', NULL),
(76, 114, 152, 40, '2026-01-14 17:38:19', 'competed', NULL),
(77, 118, 149, 39, '2026-01-14 17:50:24', 'competed', NULL),
(78, 118, 155, 39, '2026-01-14 17:50:24', 'competed', NULL),
(79, 118, 158, 42, '2026-01-14 17:50:24', 'competed', NULL),
(80, 118, 157, 39, '2026-01-14 17:50:24', 'competed', NULL),
(81, 118, 147, 40, '2026-01-14 17:50:24', 'competed', NULL),
(82, 119, 62, 41, '2026-01-14 17:52:35', 'competed', NULL),
(83, 119, 165, 40, '2026-01-14 17:52:35', 'competed', NULL),
(84, 119, 152, 40, '2026-01-14 17:52:35', 'competed', NULL),
(85, 121, 149, 41, '2026-01-15 16:20:00', 'competed', NULL),
(86, 121, 62, 40, '2026-01-15 16:20:00', 'competed', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_person`
--

DROP TABLE IF EXISTS `tbl_person`;
CREATE TABLE IF NOT EXISTS `tbl_person` (
  `person_id` int NOT NULL AUTO_INCREMENT,
  `l_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `f_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `m_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_type` enum('athlete','trainee','coach','trainor','sports_director','tournament_manager','umpire','scorer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_birth` date DEFAULT NULL,
  `gender` enum('Male','Female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_type` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`person_id`),
  KEY `fk_person_collegecode` (`college_code`)
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_person`
--

INSERT INTO `tbl_person` (`person_id`, `l_name`, `f_name`, `m_name`, `role_type`, `title`, `date_birth`, `gender`, `college_code`, `course`, `blood_type`, `is_active`) VALUES
(1, 'Santos', 'Juan', 'D', 'athlete', NULL, '2002-05-10', 'Male', 'CICS', 'BSIT', 'O+', 1),
(2, 'Reyes', 'Maria', 'L', 'athlete', NULL, '2001-04-22', 'Male', 'CAS', 'BAENG', 'A+', 1),
(3, 'Cruz', 'Peter', 'M', 'coach', 'Coach', '1985-09-15', 'Male', 'COED', NULL, 'B+', 1),
(4, 'Lopez', 'Anna', 'G', 'umpire', NULL, '1990-11-05', 'Male', 'COED', NULL, 'O-', 1),
(5, 'Garcia', 'Leo', 'P', 'sports_director', 'Director', '1975-02-20', 'Male', 'COED', NULL, 'AB+', 1),
(6, 'Villanueva', 'Kyla', 'S', 'trainor', 'Trainor', '1992-01-12', 'Male', 'COED', NULL, 'A-', 1),
(7, 'Dela Cruz', 'Mark', 'T', '', 'Manager', '1988-03-03', 'Male', 'CBA', NULL, 'B-', 1),
(8, 'Lim', 'Paolo', 'R', 'scorer', NULL, '1999-08-30', 'Male', 'CICS', 'BSIT', 'O+', 1),
(9, 'Ortega', 'Nina', 'Q', 'trainee', NULL, '2003-02-17', 'Male', 'CAF', 'BSIT', 'AB-', 1),
(10, 'Mendoza', 'Carlo', 'B', 'athlete', NULL, '2002-10-19', 'Male', 'CICS', 'BSCS', 'A+', 1),
(11, 'Tan', 'Joy', 'C', 'athlete', NULL, '2001-12-25', 'Female', 'CAS', 'BSMATH', 'B+', 1),
(12, 'Castro', 'Neil', 'E', 'coach', 'Coach', '1982-06-07', 'Male', 'COED', NULL, 'O+', 1),
(13, 'Flores', 'Gina', 'H', 'trainor', 'Trainor', '1991-04-14', 'Male', 'COED', NULL, 'A+', 1),
(14, 'Diaz', 'Ramon', 'J', 'umpire', NULL, '1989-09-09', 'Male', 'COED', NULL, 'B+', 1),
(15, 'Perez', 'Luna', 'K', 'trainee', NULL, '2003-07-07', 'Male', 'CICS', 'BSIT', 'O-', 1),
(16, 'Ramirez', 'Sarah', 'T', 'athlete', NULL, '2002-03-15', 'Male', 'CICS', 'BSIT', 'A+', 1),
(17, 'Bautista', 'Mika', 'R', 'athlete', NULL, '2001-07-20', 'Female', 'CAS', 'BAENG', 'B+', 1),
(41, 'Manager', 'Tournament', NULL, 'tournament_manager', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(42, 'Director', 'Sports', NULL, 'sports_director', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(43, 'Manager', 'Tournament', NULL, 'tournament_manager', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(44, 'Director', 'Sports', NULL, 'sports_director', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(45, 'Ultra', 'Pres', NULL, 'sports_director', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(48, 'Luna', 'Rosemarie', 'B', 'tournament_manager', 'Mr.', '1994-02-17', 'Male', 'CICS', 'BSIT', 'O+', 1),
(49, 'Gumatay', 'Kristine', 'L', 'tournament_manager', 'Ms.', '1996-10-08', 'Male', 'COED', 'BSED', 'A+', 1),
(50, 'Oladive', 'Mhia', 'G', 'tournament_manager', 'Mr.', '1995-05-14', 'Male', 'CBA', 'BSBA', 'O+', 1),
(51, 'Garin', 'Belly Joe', 'P', '', 'Mr.', '1997-09-22', 'Male', 'CICS', 'BSIT', 'A-', 1),
(52, 'Diega', 'Laila', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(53, 'GARIN', 'BELLY', 'JOE P.', 'athlete', NULL, NULL, 'Male', 'COED', 'BSIT', NULL, 1),
(54, 'Manager', 'Tournament', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(55, 'Rivera', 'Miguel', 'A', 'athlete', NULL, '2003-03-15', 'Male', 'CICS', 'BSIT', 'O+', 1),
(56, 'Torres', 'Sofia', 'B', 'athlete', NULL, '2002-06-20', 'Male', 'CAS', 'BACOMM', 'A+', 1),
(57, 'Ramos', 'Carlos', 'D', 'athlete', NULL, '2003-01-10', 'Male', 'CICS', 'BSCS', 'B+', 1),
(58, 'Morales', 'Andrea', 'L', 'athlete', NULL, '2002-09-05', 'Male', 'COED', 'BSED', 'O-', 1),
(59, 'Bautista', 'Jason', 'M', 'athlete', NULL, '2003-04-18', 'Male', 'CBA', 'BSBA', 'AB+', 1),
(60, 'Santiago', 'Elena', 'P', 'athlete', NULL, '2002-11-22', 'Male', 'CAS', 'BAENG', 'A-', 1),
(61, 'Navarro', 'Rafael', 'S', 'athlete', NULL, '2003-07-08', 'Male', 'CICS', 'BSIT', 'B-', 1),
(62, 'Castillo', 'Diana', 'T', 'athlete', NULL, '2002-12-30', 'Male', 'CAF', 'BSAGRI', 'O+', 1),
(63, 'Herrera', 'Luis', 'V', 'athlete', NULL, '2003-02-14', 'Male', 'CICS', 'BSCS', 'AB-', 1),
(64, 'Gomez', 'Isabella', 'W', 'athlete', NULL, '2002-08-25', 'Male', 'CAS', 'BSMATH', 'A+', 1),
(65, 'Alvarez', 'Daniel', 'X', '', 'Sir', '2003-05-12', 'Male', 'COED', 'BSED', 'B+', 1),
(66, 'Jimenez', 'Camila', 'Y', 'athlete', NULL, '2002-10-03', 'Female', 'CBA', 'BSBA', 'O+', 1),
(67, 'Martinez', 'Roberto', 'A', 'coach', 'Coach', '1980-04-10', 'Male', NULL, NULL, NULL, 1),
(68, 'Gonzalez', 'Patricia', 'B', 'coach', 'Coach', '1982-07-22', 'Male', NULL, NULL, NULL, 1),
(69, 'Rodriguez', 'Fernando', 'C', 'coach', 'Coach', '1978-11-15', 'Male', NULL, NULL, NULL, 1),
(70, 'Fernandez', 'Maria', 'D', 'coach', 'Coach', '1985-03-28', 'Male', NULL, NULL, NULL, 1),
(71, 'Salazar', 'Antonio', 'E', 'umpire', NULL, '1988-06-12', 'Male', NULL, NULL, NULL, 1),
(72, 'Vargas', 'Carmen', 'F', 'umpire', NULL, '1990-09-18', 'Male', NULL, NULL, NULL, 1),
(73, 'marcel', 'trainor', NULL, 'trainor', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(74, 'Garin', 'Belly Joe', 'Pascua', '', 'Mr.', '2025-12-17', 'Male', 'CICS', 'BSIT', 'A+', 1),
(77, 'Oladive', 'Jeremy', 'Geraillo', '', 'Mr.', '2025-12-17', 'Male', 'CAS', 'BSIT', 'B-', 1),
(78, 'Oladive', 'Marky', 'Geraillo', 'trainor', 'Mr.', '2025-12-17', 'Male', 'CBA', 'BSIT', 'AB+', 1),
(81, 'Sami', 'Marcelina', 'Oca', '', 'Ms.', '2025-12-16', 'Female', 'CAF', 'BSIT', 'A+', 1),
(82, 'Barcelona', 'Jodel', 'Barojabo', '', 'Mr.', '2025-12-16', 'Male', 'COED', 'BSIT', 'B-', 1),
(84, 'GARIN', 'MARK XAVIER', 'P.', '', 'Mr.', '2025-12-31', 'Male', 'CAS', 'Bachelor of Arts in English', 'B+', 1),
(85, 'GARIN', 'LENIEL', 'P.', 'athlete', 'Ms.', '2025-12-31', 'Male', 'CAS', 'Bachelor of Science in Mathematics', 'B-', 1),
(86, 'GARIN', 'IRVIN', 'JOE P.', '', 'mr', '2026-01-14', 'Male', 'CAF', 'BSIT', 'A-', 1),
(87, 'Francine', 'Daniel', 'X', '', 'Ms', '2003-05-12', 'Male', 'CAS', 'BSED', 'B+', 1),
(88, 'GARIN', 'BELLY', 'JOE P.', '', 'Mr', '2026-01-28', 'Male', 'CBA', 'BSIT', 'B+', 1),
(89, 'Baldoza', 'Francine', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(90, 'Garin', 'Noel', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(91, 'Garin', 'Noel', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(92, 'Pascua', 'Maricel', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(93, 'Arguelles', 'Niel', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(97, 'Garin', 'Noel', 'PASCUA', '', 'Mr', '2026-01-14', 'Male', 'CAS', 'BSCS', 'AB-', 1),
(98, 'GARIN', 'BELLY', 'JOE P.', '', 'Mr', '2026-01-22', 'Male', 'CBA', 'BSCS', 'AB+', 1),
(99, 'Ponce', 'Bien', 'Olchondra', '', 'Mr', '2026-01-16', 'Male', 'CAS', 'BSIT', 'B-', 1),
(100, 'Diega', 'Rose', 'Palima', '', 'Mrs', '2026-01-21', 'Female', 'CAS', 'BSIT', 'B-', 1),
(102, 'Diega', 'Ariel', 'Palima', '', 'Mr', '2026-01-21', 'Male', 'CBA', 'BSIT', 'B-', 1),
(103, 'Garin', 'Herba', 'PASCUA', 'umpire', 'Mrs', '2026-01-22', 'Male', 'CAS', 'BSCS', 'AB+', 1),
(104, 'Monica', 'Merlita', 'Pascua', '', 'Ms', '2026-01-22', 'Female', 'CBA', 'BSCS', 'B-', 1),
(105, 'Pascua', 'Noel', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(106, 'Pascua', 'Mercy', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(107, 'Tabol', 'Marnie', NULL, '', NULL, NULL, 'Male', NULL, NULL, NULL, 1),
(108, 'Dela Cruz', 'Nona', 'Xavier', '', 'Mr', '2026-01-22', 'Male', 'COED', 'BSCT', 'B-', 1),
(109, 'Gorgonia', 'Mercedes', 'Trill', 'trainor', 'Mrs', '2026-01-09', 'Male', 'CBA', 'BSIT', 'B-', 1),
(110, 'Gorgonia', 'Marcelo', 'Trill', 'trainor', 'Mrs', NULL, 'Male', 'CBA', 'BSIT', 'AB-', 1),
(111, 'Gorgonia', 'Maricar', 'Trill', '', 'Mrs', NULL, 'Male', 'CBA', 'BSIT', 'O-', 1),
(112, 'Gorgonia', 'Karding', 'Trill', '', 'Mr', '2026-01-21', 'Male', 'CBA', 'BSIT', 'B+', 1),
(113, 'GARIN', 'MACKY', 'JOE P.', 'coach', 'MR', '2026-01-20', 'Male', 'COED', 'BSIT', 'A-', 1),
(114, 'Gorgonia', 'Mema', 'Trill', '', 'Mr', '2026-01-22', 'Male', 'CBA', 'BSIT', 'AB+', 1),
(115, 'Gorgonia', 'Mafi', 'Trill', '', 'Mr', '2026-01-22', 'Male', 'CBA', 'BSIT', 'B-', 1),
(116, 'GARIN', 'True', 'JOE P.', 'sports_director', 'Mr', '2026-01-28', 'Male', 'CBA', 'BSCS', 'AB+', 1),
(117, 'GARIN', 'BELLA MAE', 'JOE P.', '', 'MR', '2026-01-16', 'Male', 'CAS', 'BSCS', 'AB+', 1),
(118, 'GARIN', 'NExy', 'JOE P.', 'sports_director', 'MR', '2026-01-15', 'Male', NULL, 'BSIT', 'B-', 1),
(119, 'GARIN', 'SIPA', 'JOE P.', '', 'MR', '2026-01-22', 'Male', 'CBA', 'BSIT', 'AB+', 1),
(120, 'DAPUG', 'CHRIS', 'PASCUA', '', 'Mr.', '2026-01-19', 'Male', 'COED', 'BSCS', 'AB+', 1),
(131, 'DAPUG', 'CHRIS', 'PASCUA', '', 'Mr.', '2026-01-19', 'Male', 'CAF', 'BSCS', 'B+', 1),
(135, 'DAPUG', 'CHRIS', 'PASCUA', '', '', '2026-01-19', 'Male', 'CAF', 'BSCS', 'AB-', 1),
(136, 'GORGONIA', 'CHRIS', 'PASCUA', '', 'Mr.', '2026-01-19', 'Male', 'CBA', 'BSCS', 'A-', 1),
(137, 'GORGONIA', 'CHRIS', 'PASCUA', '', 'Mr.', '2026-01-19', 'Male', 'CAS', 'BSCS', 'B+', 1),
(138, 'GALONO', 'CHRIS', 'PASCUA', '', 'Mr.', '2026-01-19', 'Male', 'CAF', 'BSCS', '', 1),
(139, 'TENDOY', 'CHRIS', 'PASCUA', 'athlete', 'Mr.', '2026-01-19', 'Male', 'CAS', 'BSCS', 'A-', 1),
(140, 'GARIN', 'SHEEN', 'JOE P.', 'tournament_manager', 'Mrs', '2026-01-22', 'Male', 'CBA', 'BSCS', 'AB-', 1),
(141, 'Geriane', 'Jose Ariel', NULL, 'tournament_manager', 'Mr', '2004-08-24', 'Male', 'CS', 'BSIT', 'B-', 1),
(142, 'Gatongay', 'Riva', NULL, 'coach', 'Mrs', '2026-01-17', 'Male', 'CS', 'BSIT', 'B-', 1),
(143, 'Masloc', 'Danilo', NULL, 'coach', 'Mr', '2026-01-14', 'Male', 'CAF', 'BSIT', 'AB+', 1),
(144, 'Chan', 'Celeste', NULL, 'coach', 'Mrs', '2026-01-15', 'Male', 'CS', 'BSIT', 'AB+', 1),
(145, 'Are', 'Mj', '', 'athlete', 'Mr', '2026-01-15', 'Male', 'CS', 'BSIT', 'AB-', 1),
(146, 'Ching', 'Jose', NULL, 'coach', 'Mr', '2026-01-14', 'Male', 'CS', 'BSIT', 'AB+', 1),
(147, 'Balang', 'Rossep', NULL, 'athlete', 'Mr', '2026-01-15', 'Male', 'CS', 'BSIT', 'B-', 1),
(148, 'Benesisto', 'Rogelio', NULL, 'tournament_manager', 'Mr', '2026-01-20', 'Male', 'CS', 'BSIT', 'B-', 1),
(149, 'Carpio', 'Daniel', NULL, 'athlete', 'Mr', '2026-01-14', 'Male', 'CS', 'BSIT', 'AB+', 1),
(150, 'Lopez', 'Cairon', NULL, 'athlete', 'Mr', '2026-01-20', 'Male', 'CS', 'BSIT', 'B-', 1),
(152, 'Diega', 'Rose', 'Palima', 'athlete', 'Ms', '2026-01-14', 'Male', 'CICS', 'BSIT', 'B-', 1),
(153, 'Caguerhab', 'Mark', '', 'athlete', 'Mr', '2026-01-13', 'Male', 'CS', 'BSES', 'AB+', 1),
(154, 'GARIN', 'BELLY', 'JOE P.', 'athlete', 'Mr.', '2026-01-08', 'Male', 'CS', '', 'B+', 1),
(155, 'Surio', 'Gerald', 'Perol', 'athlete', 'Mr', '2026-01-14', 'Male', 'CBA', 'BSIT', 'B+', 1),
(156, 'Baldoza', 'Francine', 'Pascua', 'athlete', 'Mr', '2026-01-19', 'Male', 'CS', 'BSIT', 'AB+', 1),
(157, 'De Rosas', 'Nathaniel', 'Perol', 'athlete', 'Mr', '2026-01-06', 'Male', 'CS', 'BSIT', 'O+', 1),
(158, 'Sabellano', 'Mercita', 'Dapug', 'athlete', 'Ms.', '2026-01-08', 'Male', 'CS', '', 'B+', 1),
(159, 'Custorio', 'Jomei', 'Nepo', 'umpire', 'Mr', '2026-01-14', 'Male', 'CS', 'BSIT', 'B-', 1),
(160, 'PUASO', 'GERALD', 'S', 'coach', 'Mr', '2026-01-23', 'Male', 'CS', 'BSIT', 'AB-', 1),
(161, 'Garin', 'Mark', 'Xavier', 'athlete', 'Mr.', '2026-01-06', 'Male', 'CS', '', 'O+', 1),
(162, 'Custorio', 'Jomei', '', 'athlete', 'Mr', '2026-01-14', 'Male', 'COED', 'BSIT', 'B-', 1),
(163, 'GARIN', 'MARCEL', 'JOE P.', 'athlete', 'Mr', '2026-01-15', 'Male', 'CVM', 'CVM', 'B+', 1),
(164, 'GARIN', 'LUCAS', 'JOE P.', 'athlete', 'Mr', '2026-01-15', 'Male', 'CS', 'CVM', 'B+', 1),
(165, 'Custorio', 'Jomei', 'G', 'athlete', 'Mr', '2026-01-12', 'Male', 'CS', 'BSCE', 'AB+', 1),
(166, 'Custorio', 'Jomei', 'G', 'athlete', 'Mr', '2026-01-12', 'Male', 'CNAHS', 'TRY', 'AB+', 1),
(167, 'GARIN', 'LUNA', 'JOE P.', 'athlete', 'Mr', '2026-01-14', 'Male', 'CS', 'BSIT', 'B-', 1),
(168, 'GARUS', 'LENIEL', 'KAYE', 'athlete', 'Ms', '2026-01-15', 'Female', NULL, 'BSED', 'B+', 1),
(169, 'TURLA', 'ZED', 'M', 'athlete', 'Mr', '2026-01-15', 'Male', 'COED', 'BPE', 'B-', 1),
(170, 'TURLA', 'DAR', 'M', 'coach', 'Mr', '2026-01-15', 'Male', 'COED', 'BPE', 'A-', 1),
(171, 'TURLA', 'LUKE', 'M', 'athlete', 'Mr', '2026-01-15', 'Male', 'COED', NULL, 'AB+', 1),
(172, 'TURLA', 'KAT', 'M', 'tournament_manager', 'Mr', NULL, 'Male', 'COED', 'BPE', 'B-', 1),
(173, 'VILLEZAR', 'ATE', '', 'athlete', 'Mrs', '2026-01-15', 'Female', 'CS', '', 'AB+', 1),
(174, 'TURLA', 'BRYAN', 'M', 'athlete', 'Mr', '2026-01-15', 'Male', 'COED', 'BPE', 'AB+', 1),
(175, 'Pomeranda', 'John Lee', 'S', 'athlete', 'Mr', '2026-01-15', 'Male', 'COED', 'BPE', 'B-', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_school`
--

DROP TABLE IF EXISTS `tbl_school`;
CREATE TABLE IF NOT EXISTS `tbl_school` (
  `school_id` int NOT NULL AUTO_INCREMENT,
  `school_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_address` text COLLATE utf8mb4_unicode_ci,
  `school_head` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_head_cp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_head_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_sports_director` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sports_dir_cp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sports_dir_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_reg` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_reg_cp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school_reg_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`school_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_school`
--

INSERT INTO `tbl_school` (`school_id`, `school_name`, `school_address`, `school_head`, `school_head_cp`, `school_head_email`, `school_sports_director`, `sports_dir_cp`, `sports_dir_email`, `school_reg`, `school_reg_cp`, `school_reg_email`) VALUES
(1, 'University of Eastern Philippines - Main Campus', 'Catarman, Northern Samar', 'Dr. Ma. Teresa A.', '09170000001', 'president@uep.edu.ph', 'Mr. Jose Ariel Geriane', '09170000002', 'sports@uep.edu.ph', 'Mr. Allan Reyes', '09170000003', 'registrar@uep.edu.ph'),
(2, 'UEP Laoang Campus', 'Laoang, Northern Samar', 'Dr. Luis S.', '09170000004', 'pres_laoang@uep.edu.ph', 'Mr. Carlo Mendez', '09170000005', 'sports_laoang@uep.edu.ph', 'Ms. Joy Lina', '09170000006', 'reg_laoang@uep.edu.ph'),
(3, 'UEP Catubig Campus', 'Catubig, Northern Samar', 'Dr. Anna C.', '09170000007', 'pres_catubig@uep.edu.ph', 'Mr. Paul Ortega', '09170000008', 'sports_catubig@uep.edu.ph', 'Ms. Marie Tan', '09170000009', 'reg_catubig@uep.edu.ph'),
(4, 'UEP Extension A', 'Northern Samar', 'Dr. Ramon D.', '09170000010', 'exta@uep.edu.ph', 'Mr. Ken Lopez', '09170000011', 'exta_sports@uep.edu.ph', 'Ms. Fe Luna', '09170000012', 'exta_reg@uep.edu.ph'),
(5, 'UEP Extension B', 'Northern Samar', 'Dr. Gina F.', '09170000013', 'extb@uep.edu.ph', 'Mr. Neil Castro', '09170000014', 'extb_sports@uep.edu.ph', 'Ms. Anna Lim', '09170000015', 'extb_reg@uep.edu.ph'),
(6, 'UEP Main', 'Catarman, N. Samar', 'Dr. Ramos', '09170000001', 'ramos@uep.edu.ph', 'Mr. Dizon', '09170000002', 'dizon@uep.edu.ph', 'Ms. Cruz', '09170000003', 'cruz@uep.edu.ph'),
(7, 'UEP Laoang', 'Laoang, N. Samar', 'Dr. Flores', '09170000004', 'flores@uep.edu.ph', 'Mr. Reyes', '09170000005', 'reyes@uep.edu.ph', 'Ms. Lopez', '09170000006', 'lopez@uep.edu.ph'),
(8, 'UEP Catubig', 'Catubig, N. Samar', 'Dr. Santos', '09170000007', 'santos@uep.edu.ph', 'Mr. Tan', '09170000008', 'tan@uep.edu.ph', 'Ms. Lim', '09170000009', 'lim@uep.edu.ph'),
(9, 'UEP Palapag', 'Palapag, N. Samar', 'Dr. Cruz', '09170000010', 'cruz@uep.edu.ph', 'Mr. Uy', '09170000011', 'uy@uep.edu.ph', 'Ms. Ong', '09170000012', 'ong@uep.edu.ph'),
(10, 'UEP Allen', 'Allen, N. Samar', 'Dr. Garcia', '09170000013', 'garcia@uep.edu.ph', 'Mr. Chua', '09170000014', 'chua@uep.edu.ph', 'Ms. Yu', '09170000015', 'yu@uep.edu.ph'),
(11, 'UEP Bobon', 'Bobon, N. Samar', 'Dr. Lee', '09170000016', 'lee@uep.edu.ph', 'Mr. Go', '09170000017', 'go@uep.edu.ph', 'Ms. Tan', '09170000018', 'tan@uep.edu.ph'),
(12, 'UEP Victoria', 'Victoria, N. Samar', 'Dr. Ong', '09170000019', 'ong@uep.edu.ph', 'Mr. Lim', '09170000020', 'lim@uep.edu.ph', 'Ms. Sy', '09170000021', 'sy@uep.edu.ph'),
(13, 'UEP San Jose', 'San Jose, N. Samar', 'Dr. Lim', '09170000022', 'lim@uep.edu.ph', 'Mr. Ang', '09170000023', 'ang@uep.edu.ph', 'Ms. Co', '09170000024', 'co@uep.edu.ph'),
(14, 'UEP Mondragon', 'Mondragon, N. Samar', 'Dr. Tan', '09170000025', 'tan@uep.edu.ph', 'Mr. Sy', '09170000026', 'sy@uep.edu.ph', 'Ms. Dee', '09170000027', 'dee@uep.edu.ph'),
(15, 'UEP Lapinig', 'Lapinig, N. Samar', 'Dr. Yu', '09170000028', 'yu@uep.edu.ph', 'Mr. Dee', '09170000029', 'dee@uep.edu.ph', 'Ms. Goh', '09170000030', 'goh@uep.edu.ph');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sports`
--

DROP TABLE IF EXISTS `tbl_sports`;
CREATE TABLE IF NOT EXISTS `tbl_sports` (
  `sports_id` int NOT NULL AUTO_INCREMENT,
  `sports_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_individual` enum('team','individual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `men_women` enum('Male','Female','Mixed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Mixed',
  `num_req_players` int DEFAULT '0',
  `num_res_players` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`sports_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_sports`
--

INSERT INTO `tbl_sports` (`sports_id`, `sports_name`, `team_individual`, `weight_class`, `men_women`, `num_req_players`, `num_res_players`, `is_active`) VALUES
(1, 'Volleyball', 'team', NULL, 'Mixed', 6, 6, 1),
(2, 'Basketball', 'team', NULL, 'Male', 5, 7, 1),
(3, 'Badminton Doubles - Womens', 'team', 'Medium', 'Female', 2, 1, 1),
(4, 'Table Tennis', 'individual', NULL, 'Mixed', 1, 1, 1),
(5, 'Athletics', 'individual', 'Varies', 'Mixed', 1, 1, 1),
(6, 'Basketball', 'team', NULL, 'Male', 5, 7, 0),
(7, 'Volleyball', 'team', NULL, 'Male', 6, 6, 0),
(8, 'Football', 'team', NULL, 'Mixed', 11, 7, 1),
(9, 'Badminton', 'individual', NULL, 'Mixed', 1, 0, 0),
(10, 'Table Tennis', 'individual', NULL, 'Mixed', 1, 0, 0),
(11, 'Athletics', 'individual', NULL, 'Mixed', 1, 0, 0),
(12, 'Chess', 'individual', NULL, 'Mixed', 1, 0, 1),
(13, 'Sepak Takraw', 'team', NULL, 'Mixed', 3, 2, 1),
(14, 'Baseball', 'team', NULL, 'Mixed', 9, 5, 1),
(15, 'Softball', 'team', NULL, 'Mixed', 9, 5, 1),
(16, 'Dance', 'individual', 'Light', 'Mixed', NULL, NULL, 1),
(17, 'Futsal', 'team', 'Light', 'Mixed', 23, 2, 1),
(18, 'Mobile Legends', 'team', 'Heavy', 'Male', 5, 1, 1),
(19, 'League of Legends', 'team', 'Medium', 'Mixed', 5, 1, 1),
(20, 'Dance Sport - Women Solo', 'individual', NULL, 'Female', 1, 0, 1),
(21, 'Dance Sport - Men Solo', 'individual', NULL, 'Male', 1, 0, 1),
(22, 'Dance Sport - Pair', 'individual', NULL, 'Mixed', 2, 0, 1),
(24, 'Volleyball - Womens', 'team', 'Light', 'Female', 12, 3, 1),
(25, 'Volleyball - Mens', 'team', 'Heavy', 'Male', 12, 3, 1),
(26, 'Sepak Takraw - Womens', 'team', 'Medium', 'Female', 3, 1, 1),
(27, 'Badminton Men - Singles', 'individual', 'Heavy', 'Male', NULL, NULL, 1),
(28, 'Badminton Single - Womens', 'individual', 'Light', 'Female', NULL, NULL, 1),
(29, 'Badminton Mens - Double', 'team', 'Heavy', 'Male', 2, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sports_team`
--

DROP TABLE IF EXISTS `tbl_sports_team`;
CREATE TABLE IF NOT EXISTS `tbl_sports_team` (
  `tour_id` int NOT NULL,
  `team_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `coach_id` int DEFAULT NULL,
  `asst_coach_id` int DEFAULT NULL,
  `trainor1_id` int DEFAULT NULL,
  `trainor2_id` int DEFAULT NULL,
  `trainor3_id` int DEFAULT NULL,
  `tournament_manager_id` int DEFAULT NULL,
  PRIMARY KEY (`tour_id`,`team_id`,`sports_id`),
  KEY `fk_spteam_team` (`team_id`),
  KEY `fk_spteam_sports` (`sports_id`),
  KEY `fk_spteam_coach` (`coach_id`),
  KEY `fk_spteam_asstcoach` (`asst_coach_id`),
  KEY `fk_spteam_trainor1` (`trainor1_id`),
  KEY `fk_spteam_trainor2` (`trainor2_id`),
  KEY `fk_spteam_trainor3` (`trainor3_id`),
  KEY `fk_tournament_manager` (`tournament_manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_sports_team`
--

INSERT INTO `tbl_sports_team` (`tour_id`, `team_id`, `sports_id`, `coach_id`, `asst_coach_id`, `trainor1_id`, `trainor2_id`, `trainor3_id`, `tournament_manager_id`) VALUES
(1, 1, 1, 3, 12, 6, 13, NULL, 54),
(1, 2, 1, 12, 3, 13, 6, NULL, NULL),
(1, 3, 2, 12, 3, 6, 2, NULL, NULL),
(1, 7, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(1, 7, 16, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 5, 1, 3, 12, 6, 13, NULL, NULL),
(3, 3, 1, 3, 3, 13, 6, NULL, NULL),
(3, 16, 8, NULL, NULL, NULL, NULL, NULL, 49),
(17, 4, 11, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 9, 1, 3, NULL, 110, NULL, NULL, 41),
(17, 9, 13, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 39, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(20, 40, 4, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 1, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 2, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 2, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 3, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 3, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 3, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 4, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 4, 4, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 4, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 4, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 5, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 5, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 5, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 6, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 6, 4, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 6, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 6, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 7, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 7, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 7, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 8, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 8, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 8, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 9, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 9, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 9, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 13, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 13, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 13, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 14, 1, NULL, NULL, NULL, NULL, NULL, 43),
(21, 14, 2, NULL, NULL, NULL, NULL, NULL, 50),
(21, 14, 5, 113, 12, NULL, NULL, NULL, 50),
(21, 14, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 14, 11, 3, NULL, NULL, NULL, NULL, 50),
(21, 15, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 15, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 16, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 16, 5, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 16, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 17, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 17, 7, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 18, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 19, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 20, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(21, 38, 2, 3, NULL, NULL, NULL, NULL, 50),
(21, 38, 5, 12, 70, NULL, NULL, NULL, 50),
(21, 38, 11, 3, NULL, NULL, NULL, NULL, NULL),
(24, 2, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 3, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 3, 11, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 6, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 6, 11, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 15, 11, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 39, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 39, 1, 142, 70, NULL, NULL, NULL, 141),
(28, 39, 2, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 39, 5, 143, NULL, NULL, NULL, NULL, 148),
(28, 39, 26, 143, NULL, NULL, NULL, NULL, 148),
(28, 40, 1, 144, NULL, NULL, NULL, NULL, 141),
(28, 40, 2, 69, NULL, NULL, NULL, NULL, NULL),
(28, 40, 5, 146, NULL, NULL, NULL, NULL, 148),
(28, 40, 12, 144, NULL, NULL, NULL, NULL, 50),
(28, 40, 14, 160, NULL, NULL, NULL, NULL, 141),
(28, 40, 21, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 40, 22, 144, NULL, NULL, NULL, NULL, 148),
(28, 41, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 41, 2, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 41, 4, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 41, 5, NULL, NULL, NULL, NULL, NULL, 148),
(28, 41, 12, 160, NULL, NULL, NULL, NULL, 50),
(28, 41, 14, 142, NULL, NULL, NULL, NULL, 141),
(28, 41, 22, 143, NULL, NULL, NULL, NULL, 148),
(28, 42, 1, NULL, NULL, NULL, NULL, NULL, 141),
(28, 42, 2, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 42, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 42, 5, 67, NULL, NULL, NULL, NULL, 148),
(29, 39, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 39, 5, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_system_config`
--

DROP TABLE IF EXISTS `tbl_system_config`;
CREATE TABLE IF NOT EXISTS `tbl_system_config` (
  `config_id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_unicode_ci,
  `config_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `config_key` (`config_key`),
  KEY `updated_by` (`updated_by`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_system_config`
--

INSERT INTO `tbl_system_config` (`config_id`, `config_key`, `config_value`, `config_type`, `description`, `updated_at`, `updated_by`) VALUES
(1, 'min_password_length', '8', 'number', 'Minimum password length', '2026-01-15 13:25:47', 22),
(2, 'require_uppercase', '1', 'boolean', 'Require uppercase letters', '2026-01-15 13:25:47', 22),
(3, 'require_lowercase', '1', 'boolean', 'Require lowercase letters', '2026-01-15 13:25:47', 22),
(4, 'require_numbers', '1', 'boolean', 'Require numbers', '2026-01-15 13:25:47', 22),
(5, 'require_special', '0', 'boolean', 'Require special characters', '2026-01-15 13:25:47', 22),
(6, 'password_expiry_days', '90', 'number', 'Password expiry in days (0 = never)', '2026-01-15 13:25:47', 22),
(7, 'session_timeout', '3600', 'number', 'Session timeout in seconds', '2026-01-15 13:25:47', 22),
(8, 'max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', '2026-01-15 13:25:47', 22),
(9, 'lockout_duration', '900', 'number', 'Account lockout duration in seconds', '2026-01-15 13:25:47', 22),
(10, 'force_logout_inactive', '1', 'boolean', 'Force logout on inactivity', '2026-01-15 13:25:47', 22);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team`
--

DROP TABLE IF EXISTS `tbl_team`;
CREATE TABLE IF NOT EXISTS `tbl_team` (
  `team_id` int NOT NULL AUTO_INCREMENT,
  `school_id` int NOT NULL,
  `team_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`team_id`),
  KEY `fk_team_school` (`school_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team`
--

INSERT INTO `tbl_team` (`team_id`, `school_id`, `team_name`, `is_active`) VALUES
(1, 1, 'UEP Main - CICS Tigers', 0),
(2, 1, 'UEP Main - CAS Falcons', 0),
(3, 2, 'UEP Laoang - Sharks', 0),
(4, 3, 'UEP Catubig - Eagles', 0),
(5, 1, 'UEP Main - COE Panthers', 0),
(6, 4, 'UEP Extension A - Spikers', 0),
(7, 5, 'UEP Extension B - Blockers', 0),
(8, 6, 'UEP Main - Setters', 0),
(9, 7, 'UEP Laoang - Servers', 0),
(13, 4, 'UEP Extension A - Spikers', 0),
(14, 5, 'UEP Extension B - Blockers', 0),
(15, 6, 'UEP Main - Setters', 0),
(16, 7, 'UEP Laoang - Servers', 0),
(17, 2, 'UEP Palapag - Monbonanons', 0),
(18, 14, 'Monbon', 0),
(19, 7, 'Sangay', 0),
(20, 4, 'Bangon', 0),
(34, 7, 'Team Monbon', 0),
(35, 7, 'Nipa', 0),
(36, 8, 'College Of Science', 0),
(37, 3, 'College Of Engineering', 0),
(38, 7, 'College Of Education', 0),
(39, 6, 'BSIT', 1),
(40, 6, 'BSES', 1),
(41, 6, 'BSMATH', 1),
(42, 6, 'BSBIO', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team_athletes`
--

DROP TABLE IF EXISTS `tbl_team_athletes`;
CREATE TABLE IF NOT EXISTS `tbl_team_athletes` (
  `team_ath_id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `team_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `person_id` int NOT NULL,
  `is_captain` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`team_ath_id`),
  KEY `fk_ta_tour` (`tour_id`),
  KEY `fk_ta_team` (`team_id`),
  KEY `fk_ta_sports` (`sports_id`),
  KEY `fk_ta_person` (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team_athletes`
--

INSERT INTO `tbl_team_athletes` (`team_ath_id`, `tour_id`, `team_id`, `sports_id`, `person_id`, `is_captain`, `is_active`) VALUES
(1, 1, 1, 1, 1, 1, 1),
(2, 1, 2, 1, 2, 1, 1),
(3, 1, 1, 2, 10, 0, 1),
(4, 1, 3, 2, 11, 1, 1),
(5, 2, 5, 1, 9, 0, 1),
(6, 21, 13, 1, 55, 1, 1),
(7, 21, 13, 1, 56, 0, 1),
(8, 21, 13, 1, 57, 0, 1),
(9, 21, 14, 1, 58, 1, 1),
(10, 21, 14, 1, 59, 0, 1),
(11, 21, 14, 1, 60, 0, 1),
(12, 21, 15, 1, 61, 1, 1),
(13, 21, 15, 1, 62, 0, 1),
(14, 21, 15, 1, 63, 0, 1),
(15, 21, 16, 1, 64, 1, 1),
(16, 21, 16, 1, 65, 0, 1),
(17, 21, 16, 1, 66, 0, 1),
(18, 1, 17, 1, 51, 1, 1),
(19, 1, 17, 1, 52, 0, 1),
(20, 1, 17, 1, 53, 0, 1),
(21, 1, 17, 1, 54, 0, 1),
(22, 1, 17, 1, 55, 0, 1),
(23, 1, 17, 1, 56, 0, 1),
(24, 1, 17, 1, 57, 0, 1),
(25, 1, 17, 1, 58, 0, 1),
(26, 1, 17, 1, 59, 0, 1),
(27, 1, 17, 1, 60, 0, 1),
(28, 21, 13, 1, 74, 1, 1),
(30, 3, 3, 1, 77, 0, 1),
(31, 3, 3, 1, 78, 0, 1),
(34, 1, 1, 1, 81, 0, 1),
(35, 1, 1, 1, 82, 0, 1),
(36, 21, 13, 1, 84, 0, 1),
(37, 1, 1, 1, 85, 0, 1),
(38, 17, 13, 1, 108, 1, 1),
(39, 5, 3, 1, 117, 1, 1),
(44, 21, 14, 1, 131, 0, 1),
(48, 21, 14, 1, 135, 1, 1),
(49, 21, 14, 1, 136, 1, 1),
(51, 21, 14, 1, 138, 1, 1),
(52, 21, 14, 1, 139, 0, 1),
(53, 17, 9, 1, 62, 0, 1),
(54, 17, 9, 1, 10, 1, 1),
(55, 3, 16, 8, 10, 0, 1),
(57, 21, 14, 5, 61, 1, 1),
(58, 21, 14, 5, 1, 0, 0),
(59, 21, 38, 5, 10, 1, 1),
(60, 21, 38, 11, 66, 0, 1),
(61, 21, 38, 5, 64, 0, 1),
(63, 28, 39, 1, 150, 0, 1),
(64, 28, 39, 5, 149, 0, 1),
(65, 28, 40, 5, 147, 0, 1),
(66, 28, 40, 1, 145, 0, 1),
(68, 28, 39, 1, 152, 1, 1),
(69, 21, 38, 2, 62, 0, 1),
(70, 28, 39, 1, 153, 1, 1),
(71, 28, 40, 1, 58, 0, 1),
(72, 28, 42, 1, 63, 1, 0),
(73, 28, 41, 1, 145, 0, 1),
(74, 28, 41, 1, 58, 0, 1),
(75, 28, 39, 1, 154, 0, 1),
(76, 28, 39, 5, 155, 0, 1),
(77, 28, 42, 5, 149, 0, 1),
(78, 28, 42, 5, 155, 0, 1),
(79, 28, 39, 1, 156, 1, 1),
(80, 28, 39, 5, 157, 0, 1),
(81, 28, 39, 1, 158, 1, 1),
(82, 28, 42, 5, 158, 0, 1),
(83, 29, 39, 1, 150, 0, 1),
(84, 29, 39, 1, 152, 1, 1),
(85, 29, 39, 1, 153, 1, 1),
(86, 29, 39, 1, 154, 0, 1),
(87, 29, 39, 1, 156, 1, 1),
(88, 29, 39, 1, 158, 1, 1),
(89, 28, 40, 2, 161, 1, 1),
(90, 28, 42, 2, 162, 1, 1),
(91, 24, 39, 1, 152, 0, 0),
(92, 24, 39, 1, 53, 0, 0),
(93, 24, 39, 1, 162, 0, 0),
(94, 24, 39, 1, 85, 0, 1),
(95, 24, 39, 1, 149, 0, 0),
(96, 24, 39, 1, 64, 0, 1),
(97, 29, 39, 5, 163, 0, 1),
(98, 20, 40, 4, 164, 0, 1),
(99, 20, 40, 4, 165, 0, 1),
(100, 17, 39, 1, 163, 0, 1),
(101, 17, 39, 1, 166, 0, 1),
(102, 17, 39, 1, 167, 0, 1),
(103, 17, 39, 1, 58, 1, 1),
(104, 17, 39, 1, 59, 0, 1),
(105, 17, 39, 1, 60, 0, 1),
(106, 17, 39, 1, 131, 0, 1),
(107, 17, 39, 1, 135, 1, 1),
(108, 17, 39, 1, 136, 1, 1),
(109, 17, 39, 1, 138, 1, 1),
(110, 17, 39, 1, 139, 0, 1),
(111, 28, 41, 22, 156, 0, 1),
(112, 28, 41, 22, 62, 0, 1),
(113, 28, 40, 22, 165, 0, 1),
(114, 28, 40, 22, 152, 0, 1),
(115, 28, 41, 5, 162, 0, 1),
(116, 28, 39, 1, 168, 0, 1),
(117, 28, 40, 21, 11, 0, 0),
(118, 28, 40, 21, 17, 0, 0),
(119, 28, 40, 22, 166, 0, 1),
(120, 28, 40, 22, 17, 0, 1),
(121, 28, 40, 21, 165, 0, 1),
(122, 28, 40, 21, 10, 0, 1),
(123, 28, 40, 21, 1, 0, 1),
(124, 28, 41, 5, 157, 0, 1),
(125, 28, 39, 26, 17, 0, 1),
(126, 28, 41, 5, 59, 0, 1),
(127, 28, 41, 5, 152, 0, 1),
(128, 28, 41, 5, 17, 0, 1),
(129, 28, 41, 5, 85, 0, 1),
(130, 28, 41, 2, 59, 0, 1),
(131, 28, 41, 2, 155, 0, 1),
(132, 28, 42, 5, 161, 0, 1),
(133, 28, 40, 14, 157, 0, 1),
(134, 28, 40, 14, 166, 0, 1),
(135, 28, 40, 5, 171, 0, 1),
(136, 28, 39, 1, 173, 0, 1),
(137, 28, 39, 1, 174, 1, 1),
(138, 28, 39, 1, 175, 1, 1),
(139, 28, 40, 12, 62, 0, 1),
(140, 28, 41, 12, 149, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team_colleges`
--

DROP TABLE IF EXISTS `tbl_team_colleges`;
CREATE TABLE IF NOT EXISTS `tbl_team_colleges` (
  `team_college_id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `team_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `college_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`team_college_id`),
  UNIQUE KEY `unique_team_sport_college` (`tour_id`,`team_id`,`sports_id`,`college_code`),
  KEY `team_id` (`team_id`),
  KEY `sports_id` (`sports_id`),
  KEY `college_code` (`college_code`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team_colleges`
--

INSERT INTO `tbl_team_colleges` (`team_college_id`, `tour_id`, `team_id`, `sports_id`, `college_code`, `created_at`) VALUES
(5, 28, 42, 1, 'CS', '2026-01-14 13:24:04'),
(6, 28, 42, 2, 'CS', '2026-01-14 13:24:04'),
(7, 28, 42, 3, 'CS', '2026-01-14 13:24:04'),
(8, 28, 42, 5, 'CS', '2026-01-14 13:24:04'),
(13, 28, 42, 1, 'CAS', '2026-01-14 13:24:15'),
(14, 28, 42, 2, 'CAS', '2026-01-14 13:24:15'),
(15, 28, 42, 3, 'CAS', '2026-01-14 13:24:15'),
(16, 28, 42, 5, 'CAS', '2026-01-14 13:24:15'),
(26, 28, 42, 1, 'CNAHS', '2026-01-14 13:28:47'),
(27, 28, 42, 2, 'CNAHS', '2026-01-14 13:28:47'),
(28, 28, 42, 3, 'CNAHS', '2026-01-14 13:28:47'),
(29, 28, 42, 5, 'CNAHS', '2026-01-14 13:28:47'),
(34, 28, 42, 1, 'COED', '2026-01-14 13:29:39'),
(35, 28, 42, 2, 'COED', '2026-01-14 13:29:39'),
(36, 28, 42, 3, 'COED', '2026-01-14 13:29:39'),
(37, 28, 42, 5, 'COED', '2026-01-14 13:29:39'),
(38, 24, 39, 1, 'CAFNR', '2026-01-14 13:31:04'),
(39, 20, 40, 4, 'CAFNR', '2026-01-14 13:48:21'),
(40, 17, 39, 1, 'CVM', '2026-01-14 14:04:18');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team_equipment`
--

DROP TABLE IF EXISTS `tbl_team_equipment`;
CREATE TABLE IF NOT EXISTS `tbl_team_equipment` (
  `equip_id` int NOT NULL AUTO_INCREMENT,
  `equip_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_acquired` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `equip_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_functional` tinyint(1) DEFAULT '1',
  `quantity` int DEFAULT '0',
  `sports_id` int DEFAULT NULL,
  PRIMARY KEY (`equip_id`),
  KEY `idx_equip_functional` (`is_functional`),
  KEY `idx_equipment_sports` (`sports_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team_equipment`
--

INSERT INTO `tbl_team_equipment` (`equip_id`, `equip_name`, `date_acquired`, `description`, `equip_image`, `is_functional`, `quantity`, `sports_id`) VALUES
(1, 'Volleyball (Mikasa)', '2025-01-05', 'Official volleyballs for training and tournaments', 'equip_1767930694_69607b46731f8.jpg', 1, 12, 1),
(2, 'Basketball (Molten)', '2025-01-05', 'Official basketballs for games and practice', 'equip_1767930670_69607b2ef0ae9.jpg', 1, 10, NULL),
(3, 'Net Set - Volleyball', '2025-01-06', 'Volleyball net with posts and ropes', 'equip_1768154721_6963e661e0577.jpeg', 1, 3, 1),
(4, 'Whistles', '2025-01-06', 'Referee whistles', 'equip_1767930653_69607b1d923cd.jpg', 1, 20, 1),
(5, 'Scoreboard (Portable)', '2025-01-07', 'Manual portable scoreboard', 'equip_1767930546_69607ab2cbc4c.jpg', 1, 2, 1),
(13, 'Sepak Takraw', '2026-01-29', 'Try langs', NULL, 1, 1, NULL),
(14, 'Running Shoes', '2026-01-08', 'Try', NULL, 1, 15, NULL),
(15, 'Jersey', '2026-01-12', 'Try langs', 'equip_1768154740_6963e6744ffa6.jpg', 1, 3, 1),
(16, 'Mat', '2026-01-28', 'try', 'equip_1768154782_6963e69eacdb3.jpg', 1, 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team_standing`
--

DROP TABLE IF EXISTS `tbl_team_standing`;
CREATE TABLE IF NOT EXISTS `tbl_team_standing` (
  `tour_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `team_id` int NOT NULL,
  `no_games_played` int DEFAULT '0',
  `no_win` int DEFAULT '0',
  `no_loss` int DEFAULT '0',
  `no_draw` int DEFAULT '0',
  `no_gold` int DEFAULT '0',
  `no_bronze` int DEFAULT '0',
  `no_silver` int DEFAULT '0',
  `athlete_id` int DEFAULT NULL,
  PRIMARY KEY (`tour_id`,`sports_id`,`team_id`),
  KEY `fk_stand_sports` (`sports_id`),
  KEY `fk_stand_team` (`team_id`),
  KEY `fk_stand_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team_standing`
--

INSERT INTO `tbl_team_standing` (`tour_id`, `sports_id`, `team_id`, `no_games_played`, `no_win`, `no_loss`, `no_draw`, `no_gold`, `no_bronze`, `no_silver`, `athlete_id`) VALUES
(1, 1, 1, 3, 3, 0, 0, 1, 0, 0, 1),
(1, 1, 2, 3, 2, 1, 0, 0, 0, 1, 2),
(1, 2, 3, 2, 2, 0, 0, 1, 0, 0, 10),
(2, 1, 5, 1, 0, 1, 0, 0, 1, 0, 9),
(3, 1, 3, 2, 2, 0, 0, 1, 0, 0, 11),
(21, 1, 13, 2, 2, 0, 0, 1, 0, 0, 55),
(21, 1, 14, 2, 1, 1, 0, 0, 1, 0, 58),
(21, 1, 15, 2, 1, 1, 0, 0, 0, 1, 61),
(21, 1, 16, 2, 0, 2, 0, 0, 0, 0, 64),
(28, 1, 39, 2, 0, 2, 0, 6, 3, 3, NULL),
(28, 1, 40, 0, 0, 0, 0, 2, 1, 3, NULL),
(28, 1, 42, 0, 0, 0, 0, 1, 0, 4, NULL),
(28, 5, 39, 1, 0, 1, 0, 1, 0, 1, 157),
(28, 5, 40, 1, 0, 1, 0, 1, 0, 0, 147),
(28, 14, 40, 0, 0, 0, 0, 0, 0, 1, NULL),
(28, 14, 41, 0, 0, 0, 0, 1, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_team_trainees`
--

DROP TABLE IF EXISTS `tbl_team_trainees`;
CREATE TABLE IF NOT EXISTS `tbl_team_trainees` (
  `team_id` int NOT NULL,
  `person_id` int NOT NULL,
  `semester` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_applied` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`team_id`,`person_id`,`semester`,`school_year`),
  KEY `idx_person_id` (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_team_trainees`
--

INSERT INTO `tbl_team_trainees` (`team_id`, `person_id`, `semester`, `school_year`, `date_applied`, `is_active`) VALUES
(1, 9, '1st Sem', '2025-2026', '2025-01-05', 1),
(2, 15, '1st Sem', '2025-2026', '2025-01-06', 1),
(3, 9, '1st Sem', '2025-2026', '2025-01-07', 1),
(4, 15, '1st Sem', '2025-2026', '2025-01-07', 1),
(5, 9, '1st Sem', '2025-2026', '2025-01-08', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tournament`
--

DROP TABLE IF EXISTS `tbl_tournament`;
CREATE TABLE IF NOT EXISTS `tbl_tournament` (
  `tour_id` int NOT NULL AUTO_INCREMENT,
  `tour_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tour_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`tour_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_tournament`
--

INSERT INTO `tbl_tournament` (`tour_id`, `tour_name`, `school_year`, `tour_date`, `is_active`) VALUES
(1, 'UEP Intramurals 2025', '2025-2026', '2025-02-10', 0),
(2, 'UEP Friendship Games', '2025-2026', '2025-03-05', 0),
(3, 'UEP Sports Festival', '2025-2026', '2025-04-12', 0),
(4, 'UEP Inter-Campus Meet', '2025-2026', '2025-05-20', 0),
(5, 'UEP Summer Tournament', '2025-2026', '2025-06-15', 0),
(11, 'Inter-College Games', '2024-2025', '2024-08-05', 0),
(12, 'Women Sports Fest', '2024-2025', '2024-09-12', 0),
(13, 'Men Sports Fest', '2024-2025', '2024-10-01', 0),
(14, 'All-Star Games', '2024-2025', '2024-11-20', 0),
(15, 'UEP Championship', '2024-2025', '2024-12-15', 0),
(16, 'Bobon', '2025-2026', '2025-12-17', 0),
(17, 'UEP Volleyball Championship 2026', '2025-2026', '2026-02-15', 0),
(20, 'UEP', '2025-2026', '2025-12-09', 0),
(21, 'UEP Volleyball Championship 2026', '2025-2026', '2026-02-15', 0),
(22, 'UEP', '2024-2025', '2026-01-13', 0),
(24, 'Bola Kontra Droga', '2024-2025', '2026-01-24', 0),
(28, 'CS-DAYS', '2025-2026', '2026-01-23', 1),
(29, 'CS-DAY-2026', '2025-2026', '2026-01-16', 0),
(30, 'PALAPAG INTERTOWN', '2026-2027', '2026-01-16', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tournament_sports_selection`
--

DROP TABLE IF EXISTS `tbl_tournament_sports_selection`;
CREATE TABLE IF NOT EXISTS `tbl_tournament_sports_selection` (
  `tour_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tour_id`,`sports_id`),
  KEY `sports_id` (`sports_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_tournament_sports_selection`
--

INSERT INTO `tbl_tournament_sports_selection` (`tour_id`, `sports_id`, `created_at`) VALUES
(1, 1, '2026-01-13 14:29:21'),
(1, 2, '2026-01-13 14:29:21'),
(2, 1, '2026-01-13 14:29:21'),
(2, 3, '2026-01-13 14:29:21'),
(3, 1, '2026-01-13 14:29:21'),
(3, 4, '2026-01-13 14:29:21'),
(4, 5, '2026-01-13 14:29:21'),
(5, 5, '2026-01-13 14:29:21'),
(5, 6, '2026-01-13 14:29:21'),
(15, 1, '2026-01-13 14:29:21'),
(17, 6, '2026-01-05 12:16:40'),
(17, 11, '2026-01-05 12:16:40'),
(21, 1, '2026-01-04 14:10:39'),
(21, 2, '2026-01-05 05:04:43'),
(21, 3, '2026-01-04 12:35:06'),
(21, 4, '2026-01-04 06:53:45'),
(21, 5, '2026-01-04 06:50:45'),
(21, 7, '2026-01-04 14:10:39'),
(21, 11, '2026-01-05 12:45:55'),
(21, 12, '2026-01-04 06:50:53'),
(21, 18, '2026-01-05 12:30:46'),
(24, 3, '2026-01-04 06:51:24'),
(24, 11, '2026-01-04 06:51:23'),
(28, 1, '2026-01-13 14:29:21'),
(28, 5, '2026-01-13 14:29:21');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tournament_teams`
--

DROP TABLE IF EXISTS `tbl_tournament_teams`;
CREATE TABLE IF NOT EXISTS `tbl_tournament_teams` (
  `tour_team_id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `team_id` int NOT NULL,
  `registration_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`tour_team_id`),
  UNIQUE KEY `unique_tour_team` (`tour_id`,`team_id`),
  KEY `team_id` (`team_id`)
) ENGINE=MyISAM AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_tournament_teams`
--

INSERT INTO `tbl_tournament_teams` (`tour_team_id`, `tour_id`, `team_id`, `registration_date`, `is_active`) VALUES
(25, 20, 40, '2026-01-14 21:47:30', 1),
(24, 24, 39, '2026-01-14 21:30:23', 1),
(5, 17, 9, '2026-01-07 21:00:27', 1),
(6, 21, 14, '2026-01-07 21:00:53', 1),
(7, 3, 16, '2026-01-08 08:16:30', 1),
(8, 1, 13, '2026-01-08 08:34:15', 1),
(9, 1, 7, '2026-01-08 08:34:21', 1),
(14, 21, 38, '2026-01-08 12:20:42', 1),
(16, 28, 39, '2026-01-09 19:18:05', 1),
(17, 28, 40, '2026-01-09 19:18:15', 1),
(18, 28, 41, '2026-01-09 19:18:21', 1),
(19, 28, 42, '2026-01-09 19:18:30', 1),
(20, 29, 39, '2026-01-13 01:49:46', 1),
(21, 29, 40, '2026-01-13 01:49:52', 1),
(22, 29, 41, '2026-01-13 01:50:04', 1),
(23, 17, 39, '2026-01-13 18:42:41', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_tournament_umpire_assignments`
--

DROP TABLE IF EXISTS `tbl_tournament_umpire_assignments`;
CREATE TABLE IF NOT EXISTS `tbl_tournament_umpire_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `sports_id` int NOT NULL,
  `person_id` int NOT NULL COMMENT 'Umpire person_id',
  `assigned_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` int DEFAULT NULL COMMENT 'Person who made the assignment',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_tournament_sport_umpire` (`tour_id`,`sports_id`,`person_id`),
  KEY `fk_umpire_assign_sport` (`sports_id`),
  KEY `idx_tour_sport` (`tour_id`,`sports_id`),
  KEY `idx_umpire` (`person_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_tournament_umpire_assignments`
--

INSERT INTO `tbl_tournament_umpire_assignments` (`assignment_id`, `tour_id`, `sports_id`, `person_id`, `assigned_date`, `assigned_by`, `is_active`) VALUES
(1, 1, 1, 4, '2026-01-13 22:23:02', NULL, 1),
(2, 1, 2, 14, '2026-01-13 22:23:02', NULL, 1),
(3, 2, 1, 4, '2026-01-13 22:23:02', NULL, 1),
(4, 3, 1, 14, '2026-01-13 22:23:02', NULL, 1),
(5, 5, 5, 4, '2026-01-13 22:23:02', NULL, 1),
(6, 1, 1, 3, '2026-01-13 22:23:02', NULL, 1),
(7, 1, 2, 3, '2026-01-13 22:23:02', NULL, 1),
(8, 2, 3, 3, '2026-01-13 22:23:02', NULL, 1),
(9, 3, 4, 3, '2026-01-13 22:23:02', NULL, 1),
(10, 4, 5, 3, '2026-01-13 22:23:02', NULL, 1),
(11, 5, 6, 3, '2026-01-13 22:23:02', NULL, 1),
(12, 21, 1, 71, '2026-01-13 22:23:02', NULL, 1),
(13, 21, 1, 72, '2026-01-13 22:23:02', NULL, 1),
(18, 21, 5, 103, '2026-01-13 22:23:02', NULL, 1),
(19, 21, 5, 4, '2026-01-13 22:23:02', NULL, 1),
(20, 21, 2, 103, '2026-01-13 22:23:02', NULL, 1),
(21, 21, 5, 14, '2026-01-13 22:23:02', NULL, 1),
(22, 21, 2, 4, '2026-01-13 22:23:02', NULL, 1),
(23, 28, 1, 14, '2026-01-13 22:23:02', NULL, 0),
(24, 28, 5, 103, '2026-01-13 22:23:02', NULL, 1),
(25, 28, 5, 4, '2026-01-13 22:23:02', NULL, 1),
(26, 28, 5, 71, '2026-01-13 22:23:02', NULL, 1),
(27, 28, 1, 103, '2026-01-13 22:23:02', NULL, 0),
(28, 28, 1, 71, '2026-01-13 22:23:02', NULL, 0),
(29, 28, 1, 4, '2026-01-13 23:27:18', NULL, 1),
(30, 28, 5, 14, '2026-01-13 22:23:02', NULL, 1),
(31, 28, 1, 72, '2026-01-13 23:27:18', NULL, 1),
(32, 28, 1, 159, '2026-01-13 23:27:18', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_training_activity`
--

DROP TABLE IF EXISTS `tbl_training_activity`;
CREATE TABLE IF NOT EXISTS `tbl_training_activity` (
  `activity_id` int NOT NULL AUTO_INCREMENT,
  `activity_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sports_id` int NOT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repetition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`activity_id`),
  KEY `fk_activity_sports` (`sports_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_training_activity`
--

INSERT INTO `tbl_training_activity` (`activity_id`, `activity_name`, `sports_id`, `duration`, `repetition`, `is_active`) VALUES
(1, 'Basic Passing Drill', 1, '30 mins', '3 sets', 1),
(2, 'Serving Accuracy', 1, '25 mins', '4 sets', 1),
(3, 'Layup Drill', 2, '20 mins', '5 sets', 1),
(4, 'Footwork and Agility', 3, '20 mins', '4 sets', 1),
(5, 'Sprint Intervals', 5, '15 mins', '6 sets', 1),
(6, 'Jog', 5, '35', '3', 1),
(7, 'Jump Jack', 1, '15', '3', 0),
(8, 'Dribbling Drills', 1, '32 minutes', '2 sets', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_attend`
--

DROP TABLE IF EXISTS `tbl_train_attend`;
CREATE TABLE IF NOT EXISTS `tbl_train_attend` (
  `sked_id` int NOT NULL,
  `person_id` int NOT NULL,
  `is_present` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`sked_id`,`person_id`),
  KEY `fk_attend_person` (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_attend`
--

INSERT INTO `tbl_train_attend` (`sked_id`, `person_id`, `is_present`) VALUES
(1, 1, 1),
(1, 10, 1),
(2, 2, 1),
(3, 9, 0),
(5, 9, 1),
(5, 11, 1),
(6, 9, 1),
(7, 1, 0),
(7, 9, 1),
(7, 81, 1),
(7, 82, 0),
(7, 85, 0),
(8, 9, 0),
(9, 9, 1),
(10, 9, 0),
(11, 9, 1),
(12, 9, 1),
(13, 9, 1),
(22, 9, 1),
(23, 137, 0),
(24, 1, 1),
(24, 61, 1),
(25, 61, 1),
(26, 61, 1),
(34, 145, 1),
(35, 145, 1),
(36, 150, 1),
(36, 152, 1),
(36, 153, 1),
(37, 149, 1),
(38, 145, 1),
(40, 149, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_perf`
--

DROP TABLE IF EXISTS `tbl_train_perf`;
CREATE TABLE IF NOT EXISTS `tbl_train_perf` (
  `perf_id` int NOT NULL AUTO_INCREMENT,
  `person_id` int NOT NULL,
  `activitity_id` int NOT NULL,
  `rating` decimal(5,2) DEFAULT NULL,
  `date_eval` date NOT NULL,
  `team_id` int DEFAULT NULL,
  PRIMARY KEY (`perf_id`),
  KEY `fk_perf_person` (`person_id`),
  KEY `fk_perf_activity` (`activitity_id`),
  KEY `fk_perf_team` (`team_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_perf`
--

INSERT INTO `tbl_train_perf` (`perf_id`, `person_id`, `activitity_id`, `rating`, `date_eval`, `team_id`) VALUES
(1, 1, 1, 4.20, '2025-01-15', 1),
(2, 2, 2, 4.10, '2025-01-15', 2),
(3, 10, 3, 4.50, '2025-01-15', 1),
(4, 11, 4, 4.00, '2025-01-16', 2),
(5, 9, 5, 3.90, '2025-01-16', 5),
(6, 120, 3, 8.00, '2026-01-07', 6),
(7, 61, 6, 3.00, '2026-01-08', 14),
(8, 145, 1, 5.00, '2026-01-09', 40),
(9, 149, 5, 8.00, '2026-01-10', 39),
(10, 150, 1, 7.00, '2026-01-11', 39),
(11, 153, 2, 8.00, '2026-01-11', 39),
(12, 58, 2, 3.00, '2026-01-14', 40);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_sked`
--

DROP TABLE IF EXISTS `tbl_train_sked`;
CREATE TABLE IF NOT EXISTS `tbl_train_sked` (
  `sked_id` int NOT NULL AUTO_INCREMENT,
  `team_id` int NOT NULL,
  `trainor_id` int NOT NULL,
  `sked_date` date NOT NULL,
  `sked_time` time NOT NULL,
  `venue_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`sked_id`),
  KEY `fk_sked_team` (`team_id`),
  KEY `idx_trainor_id` (`trainor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_sked`
--

INSERT INTO `tbl_train_sked` (`sked_id`, `team_id`, `trainor_id`, `sked_date`, `sked_time`, `venue_id`, `is_active`) VALUES
(1, 1, 6, '2025-01-20', '16:00:00', 0, 1),
(2, 2, 13, '2025-01-20', '17:00:00', 0, 1),
(3, 3, 6, '2025-01-21', '16:00:00', 0, 1),
(4, 4, 0, '2025-01-21', '17:00:00', 0, 1),
(5, 5, 6, '2025-01-22', '16:30:00', 0, 1),
(6, 1, 0, '2025-01-06', '16:00:00', 1, 1),
(7, 1, 0, '2025-01-08', '16:00:00', 1, 1),
(8, 1, 0, '2025-01-10', '16:00:00', 1, 1),
(9, 1, 0, '2025-01-13', '16:00:00', 1, 1),
(10, 1, 0, '2025-01-15', '16:00:00', 1, 1),
(11, 1, 0, '2025-01-17', '16:00:00', 1, 1),
(12, 1, 0, '2025-01-20', '16:00:00', 1, 1),
(13, 1, 0, '2025-01-22', '16:00:00', 1, 1),
(21, 2, 6, '2026-01-15', '09:31:00', 10, 1),
(22, 5, 6, '2026-01-14', '13:29:00', 3, 1),
(23, 6, 113, '2026-01-23', '21:21:00', 14, 1),
(24, 14, 113, '2026-02-04', '12:21:00', 14, 1),
(25, 14, 113, '2026-01-21', '21:28:00', 16, 1),
(26, 14, 113, '2026-01-23', '21:40:00', 15, 1),
(27, 9, 3, '2026-01-14', '00:48:00', 11, 1),
(28, 3, 3, '2026-01-24', '00:49:00', 11, 1),
(29, 1, 3, '2026-01-23', '11:31:00', 15, 1),
(30, 3, 3, '2026-01-14', '12:40:00', 11, 1),
(31, 1, 3, '2026-01-14', '16:42:00', 15, 1),
(32, 1, 3, '2026-01-09', '13:10:00', 6, 1),
(33, 3, 3, '2026-01-09', '12:00:00', 14, 1),
(34, 40, 144, '2026-01-22', '20:15:00', 11, 1),
(35, 40, 144, '2026-01-17', '12:05:00', 15, 1),
(36, 39, 142, '2026-01-20', '10:41:00', 11, 1),
(37, 39, 143, '2026-01-15', '01:15:00', 11, 1),
(38, 40, 144, '2026-01-14', '01:28:00', 16, 1),
(39, 40, 144, '2026-01-29', '05:39:00', 11, 1),
(40, 39, 143, '2026-01-16', '00:47:00', 11, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_sked_activities`
--

DROP TABLE IF EXISTS `tbl_train_sked_activities`;
CREATE TABLE IF NOT EXISTS `tbl_train_sked_activities` (
  `sked_activity_id` int NOT NULL AUTO_INCREMENT,
  `sked_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `sequence_order` int DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`sked_activity_id`),
  UNIQUE KEY `unique_sked_activity` (`sked_id`,`activity_id`),
  KEY `activity_id` (`activity_id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_sked_activities`
--

INSERT INTO `tbl_train_sked_activities` (`sked_activity_id`, `sked_id`, `activity_id`, `sequence_order`, `notes`) VALUES
(1, 27, 1, 1, NULL),
(2, 27, 2, 2, NULL),
(3, 28, 1, 1, NULL),
(4, 28, 2, 2, NULL),
(5, 29, 2, 1, NULL),
(6, 30, 1, 1, NULL),
(7, 30, 2, 2, NULL),
(8, 31, 1, 1, NULL),
(9, 31, 2, 2, NULL),
(10, 32, 1, 1, NULL),
(11, 33, 2, 1, NULL),
(12, 34, 1, 1, NULL),
(13, 34, 7, 2, NULL),
(14, 35, 7, 1, NULL),
(15, 36, 1, 1, NULL),
(16, 36, 2, 2, NULL),
(17, 37, 6, 1, NULL),
(18, 37, 5, 2, NULL),
(19, 38, 1, 1, NULL),
(20, 38, 2, 2, NULL),
(21, 39, 1, 1, NULL),
(22, 40, 6, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_sked_equipment`
--

DROP TABLE IF EXISTS `tbl_train_sked_equipment`;
CREATE TABLE IF NOT EXISTS `tbl_train_sked_equipment` (
  `sked_equip_id` int NOT NULL AUTO_INCREMENT,
  `sked_id` int NOT NULL,
  `equip_id` int NOT NULL,
  `quantity_used` int DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`sked_equip_id`),
  UNIQUE KEY `unique_sked_equip` (`sked_id`,`equip_id`),
  KEY `equip_id` (`equip_id`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_sked_equipment`
--

INSERT INTO `tbl_train_sked_equipment` (`sked_equip_id`, `sked_id`, `equip_id`, `quantity_used`, `notes`) VALUES
(1, 29, 3, 1, NULL),
(2, 29, 5, 1, NULL),
(3, 29, 4, 1, NULL),
(4, 30, 13, 1, NULL),
(5, 31, 2, 1, NULL),
(6, 32, 14, 1, NULL),
(7, 33, 3, 1, NULL),
(8, 33, 14, 5, NULL),
(9, 34, 3, 1, NULL),
(10, 35, 13, 1, NULL),
(11, 36, 2, 1, NULL),
(12, 36, 3, 1, NULL),
(13, 36, 5, 1, NULL),
(14, 36, 13, 1, NULL),
(15, 37, 2, 1, NULL),
(16, 37, 14, 1, NULL),
(17, 38, 2, 1, NULL),
(18, 38, 5, 1, NULL),
(19, 39, 2, 1, NULL),
(20, 39, 1, 1, NULL),
(21, 40, 2, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_train_sked_participants`
--

DROP TABLE IF EXISTS `tbl_train_sked_participants`;
CREATE TABLE IF NOT EXISTS `tbl_train_sked_participants` (
  `participant_id` int NOT NULL AUTO_INCREMENT,
  `sked_id` int NOT NULL,
  `person_id` int NOT NULL,
  `participant_type` enum('athlete','trainee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`participant_id`),
  UNIQUE KEY `unique_sked_participant` (`sked_id`,`person_id`),
  KEY `person_id` (`person_id`)
) ENGINE=MyISAM AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_train_sked_participants`
--

INSERT INTO `tbl_train_sked_participants` (`participant_id`, `sked_id`, `person_id`, `participant_type`, `notes`) VALUES
(1, 24, 61, 'athlete', NULL),
(2, 25, 61, 'athlete', NULL),
(3, 26, 61, 'athlete', NULL),
(4, 22, 9, 'athlete', NULL),
(5, 10, 1, 'athlete', NULL),
(6, 10, 81, 'athlete', NULL),
(7, 10, 82, 'athlete', NULL),
(8, 10, 85, 'athlete', NULL),
(9, 10, 9, 'trainee', NULL),
(10, 13, 1, 'athlete', NULL),
(11, 13, 81, 'athlete', NULL),
(12, 13, 82, 'athlete', NULL),
(13, 13, 85, 'athlete', NULL),
(14, 13, 9, 'trainee', NULL),
(15, 7, 1, 'athlete', NULL),
(16, 7, 81, 'athlete', NULL),
(17, 7, 82, 'athlete', NULL),
(18, 7, 85, 'athlete', NULL),
(19, 7, 9, 'trainee', NULL),
(20, 23, 137, 'athlete', NULL),
(21, 5, 9, 'athlete', NULL),
(22, 8, 1, 'athlete', NULL),
(23, 8, 81, 'athlete', NULL),
(24, 8, 82, 'athlete', NULL),
(25, 8, 85, 'athlete', NULL),
(26, 8, 9, 'trainee', NULL),
(27, 1, 1, 'athlete', NULL),
(28, 1, 81, 'athlete', NULL),
(29, 1, 82, 'athlete', NULL),
(30, 1, 85, 'athlete', NULL),
(31, 1, 9, 'trainee', NULL),
(32, 3, 77, 'athlete', NULL),
(33, 3, 78, 'athlete', NULL),
(34, 3, 117, 'athlete', NULL),
(35, 3, 9, 'trainee', NULL),
(36, 27, 62, 'athlete', NULL),
(37, 27, 10, 'athlete', NULL),
(38, 28, 117, 'athlete', NULL),
(39, 28, 77, 'athlete', NULL),
(40, 29, 85, 'athlete', NULL),
(41, 29, 9, 'trainee', NULL),
(42, 30, 117, 'athlete', NULL),
(43, 30, 9, 'trainee', NULL),
(44, 31, 85, 'athlete', NULL),
(45, 32, 82, 'athlete', NULL),
(46, 32, 9, 'trainee', NULL),
(47, 33, 117, 'athlete', NULL),
(48, 34, 145, 'athlete', NULL),
(49, 35, 145, 'athlete', NULL),
(50, 36, 153, 'athlete', NULL),
(51, 36, 152, 'athlete', NULL),
(52, 36, 150, 'athlete', NULL),
(53, 37, 149, 'athlete', NULL),
(54, 38, 145, 'athlete', NULL),
(55, 39, 145, 'athlete', NULL),
(56, 40, 149, 'athlete', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

DROP TABLE IF EXISTS `tbl_users`;
CREATE TABLE IF NOT EXISTS `tbl_users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `person_id` int NOT NULL,
  `username` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` enum('system administrator','trainor','trainee','coach','athlete/player','sports director','umpire','Tournament manager','Spectator','scorer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_person` (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=576 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`user_id`, `person_id`, `username`, `password`, `user_role`, `is_active`) VALUES
(1, 5, 'bellyjoe', 'bellyjoe', 'Tournament manager', 1),
(2, 7, 'belly', 'belly', 'Tournament manager', 1),
(3, 3, 'uep.coach.cruz', '$2y$10$zz3b2GLTmR/AJzKWIJaMWO3XNdG9W8VFHuP3R6OkCHvH07vAMT6ee', 'coach', 1),
(4, 4, 'umpire.lopez', '$2y$10$eEOIhtgpnEP.rsRWQWO1/.oZ0nu5c70LBfyC6oRC5Vtl2SEk7.xzK', 'umpire', 1),
(5, 8, 'uep.scorer.lim', 'password123', 'scorer', 1),
(6, 1, 'athlete_juan', '$2y$10$w0kEqV4OKU6UiX3qpAhVUeXQusrM9BuUcb/EW2NTYad9M7YU/7VCe', 'athlete/player', 1),
(7, 2, 'spectator.maria', '$2y$10$pOLG3w3.wdXPHaMRrpkLd.HINcQnSPkkFNiFaHIFNS76MSyQOh.Wi', 'Spectator', 1),
(8, 3, 'peter_user', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'coach', 1),
(9, 4, 'umpire_anna', '$2y$10$MENAtBI6t18F/9MDG9pm4OZnJv.o9sUsWPWcC/VLZuULQ/rLDiArC', 'umpire', 1),
(10, 5, 'sports_director', '$2y$10$Z7fRMnQDX3fkgUsP9J/pG.RjUpD8ZqA11Obs.AaIUgMY1sArx7AJC', 'sports director', 1),
(11, 6, 'trainor_kyla', '$2y$10$CXxXiyMRWx2Pyhqyljvzpukjo/zwnT8yFa9zPiR6PZv5y8KQ5nBRe', 'trainor', 1),
(12, 7, 'mark_user', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Tournament manager', 1),
(13, 8, 'paolo_user', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'scorer', 1),
(14, 9, 'trainee', '$2y$10$sd2pJW.j7MBYTjr7RDp78eu7nD7X5kWAc7XXK4TMLQ8wCiZvrDl2m', 'trainee', 1),
(15, 10, 'carlo_user', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '', 1),
(22, 45, 'admin', '$2y$10$72OZJFfeBb.4hf4UFgGaQO/JuT9qZP/s6SYc0m7OBp5fq40.25CSK', 'system administrator', 1),
(23, 49, 'manager_kristine', '$2y$10$aJ4ev1IXZE/WW8uo8V/2D.vXhnobssoz6nd14nEjOBfkS/hsuH1E.', 'Tournament manager', 1),
(24, 48, 'tm_rosemarie', 'e01fbfdea4fa58d3007093b9ff3708bc031376c3442279511d1b607d1e1c5fe5', '', 1),
(26, 51, 'tm_belly joe', 'b2b76e580931cf8447ca86737eff942203a663c81754854323800a1350e0954f', 'Tournament manager', 1),
(44, 50, 'manager_mhia', '$2y$10$4M.pZCYM0PJxBrQeqOfFM.6fhANzqqD27xhQlE92obmPrUuq8RFXm', 'Tournament manager', 1),
(502, 52, 'athlete_laila', '$2y$10$9jwn.SVdXKFfqPqNrffi1etF5eoZ09Z9k1VHHc1g9Sib1biSKwWeK', 'athlete/player', 1),
(503, 54, 'tournament_manager', '$2y$10$27T44KxfraU/J4QcQ5IDy.F6JuWZuw9GJYuRhctQlbTnbw4Zv0sVu', 'Tournament manager', 1),
(504, 73, 'trainor_marcel', 'trainor123', 'trainor', 1),
(505, 74, 'player.bellyjoe', '$2y$10$kU0ObTJAzt.jZRCZ5TBAIu3MvAB/Am4DsM0ZhURdfQXuTneN7aW1G', 'athlete/player', 1),
(507, 77, 'jeremy.oladive', '$2y$10$xjOFw.9Xx1.v1dN/ZN9oJO7tsstRHJ6/EMHfJqSX7ktoEl0n8NfzK', 'athlete/player', 1),
(508, 78, 'trainor_marky', 'trainor123', 'trainor', 1),
(511, 81, 'marcelina.sami', '$2y$10$mqXEp5YGIbDp9vjRD60ZleqyL4DBnEwtzmhm0imvSxMbvS/MZq0qW', 'athlete/player', 1),
(512, 82, 'jodel.barcelona', '$2y$10$Ye5Fs4E8ab9RTiWdwSj/OOWGRR31Zbkn0bRgZAKBbJl3JN9ewxWaS', 'athlete/player', 1),
(513, 84, 'markxavier.garin', '$2y$10$VyprIgk09gVY6avilL/3l.zyqgn59osnV59fN5GLsYNTEDazgJ3Oy', 'athlete/player', 1),
(514, 85, 'leniel.garin', '$2y$10$O3u9mESTS1jP7wKoukHoTu5kBNK4rjex.qkb5MkS2wVV4JD7urHIe', 'athlete/player', 1),
(515, 89, 'athlete_francine', 'athlete123', 'athlete/player', 1),
(516, 90, 'admin_noel', 'admin123', 'system administrator', 1),
(517, 91, 'tournament_manager_noel', 'tour123', 'Tournament manager', 1),
(518, 92, 'admin_maricel', '$2y$10$UXvT5MO6YN7OCyV0154ksejPV/vAw.l9e7Erf7GyMlb6BTFKSkdx6', 'system administrator', 1),
(519, 93, 'spectator_niel', '$2y$10$G5bHgi84OlNQU18v5FDQsOJ4P6kZC0aqq7zd646LAsCpLU.5t0ZL2', 'Spectator', 1),
(521, 97, 'tournament_manager_indoy', '$2y$10$.z6XnTuWZah.zJUyAuPSi.qv2V8H2KjtPBTYibkP0HJ4Dgj.ZKSLC', 'Tournament manager', 1),
(522, 98, 'tournament_manager_belly', '$2y$10$/zS9W0Pi0L6QNWMlFHjju./.xXvAUNpos09SGBzetZi2FFL.8PZuq', 'Tournament manager', 1),
(523, 99, 'athlete_bien', '$2y$10$nxxfhOnz2ZqzGG.BDZcBfuPk9VV6qsSApgAZWqubY34u0d89tm0iG', 'athlete/player', 1),
(524, 100, 'spectator_rose', '$2y$10$6j.YYOwLQ57s2hA.6J8FaeTsduGO/Vd4nps9j1ECF18IH0W6X9k8i', 'Spectator', 1),
(526, 102, 'spectator_ariel', '$2y$10$s8olcp00c/d3W185.vfvW.6cBXEtKhLgm0CWO7oMzRpkAe74nduMm', 'athlete/player', 1),
(527, 103, 'umpire_herba', '$2y$10$Eb/7yC.QeUnQnRipVUzot.qfavaBAGOPhTzg4hAO294FLDgULm.su', 'umpire', 1),
(528, 104, 'tournament_manager_merlita', '$2y$10$NTklZOeR2nv1yWBCqSJUf.0cTjgQ0whB4GMfcs5B4P97V3WWtRC9u', 'Tournament manager', 1),
(529, 105, 'tour_noel', 'admin123', 'Tournament manager', 1),
(530, 106, 'athlete_mercy', 'athlete123', 'athlete/player', 1),
(531, 107, 'athlete_marnie', 'athlete123', 'athlete/player', 1),
(532, 108, 'althlete_nona', '$2y$10$ioauVQaRPVY/D1WbAb8B3OTbLH24RkIfmpTVafzypRMi8ZBtOwknm', 'athlete/player', 1),
(533, 109, 'trainor_mercedes', '$2y$10$/THBy4KazyccJxA/ivsf8ef354eXN3zPZfqdgpprbk8c3PL.Hj04i', 'trainor', 1),
(534, 110, 'admin_marcelo', '$2y$10$fRu8OU1I2EVtV2nxSbzQCOzM0ZZyCDcShEqdG.BxIVqAPMN/HhEee', 'trainor', 1),
(535, 111, 'tour_maricar', '$2y$10$bHnUHeOh.f27b1ab4Cwk1uBPvcB1NkyPwYLMgEbsQ4hj5SWZKY1sy', 'Tournament manager', 1),
(536, 112, 'tour_karding', '$2y$10$5ZgtgoqCuSDDHkL0XR24M.BUeiEXqbSEXZdYKfIRQ/YTHHx1rR.oe', 'Tournament manager', 1),
(537, 113, 'coach_macky', '$2y$10$2tRdfTv4/SFion1HHUxWOOlLfusOiEWSVGTKTYhngs5vZWhIMLSD6', 'coach', 1),
(538, 114, 'spectator_karding', '$2y$10$Xlk0La2UnXEzTbxKELSPlu0b9UlmLauoLEglB68BnAlnuzMGBjU8m', 'Spectator', 1),
(539, 115, 'director_mafi', '$2y$10$gYUqD3GbIxhgep.pQTM2GeDk20nGtc3K63hmhJx2tb3pInxuUJ3Nq', 'sports director', 1),
(540, 116, 'director_true', '$2y$10$GREzRUSTGcfKeniKCmxci.UndHBO/g8AhkDJAy1f.vSm8rqwIiQJy', 'sports director', 1),
(541, 117, 'athlete_bella', '$2y$10$Po.1kR101m8lJ.hYRJ2o7.dtk78glvInrYGGUCn2/VCMZ.Hkheb7a', 'athlete/player', 1),
(542, 118, 'director_nexy', '$2y$10$7eezjFnI0v4JH3j4l.E9XOtAVInsXPD3pNFTODVzzStTtILpYnKM.', 'sports director', 1),
(543, 119, 'manager_sipa', '$2y$10$4nG7nR/IhcFiu6jeEpY4i.1u/pk.f/lP7pO.fzkqREER9GVb8cNVi', 'Tournament manager', 1),
(544, 140, 'tournament_manager_sheen', '$2y$10$MvLHLV62AvYLWtc1wmEv/Ojpjct7Ws/UBWN.Y5o85q5eRq4r6ZBJK', 'Tournament manager', 1),
(545, 141, 'manager_geriane', '$2y$10$jRI/RiEPpZC8sTr7VsQ25etGclkAlpvu8hdAfk2QLzHSWLoehdpTa', 'Tournament manager', 1),
(546, 142, 'coach_gatongay', '$2y$10$H1XpGMlGubCvjzVAmLXplOiCtZxQFmTqI89HgnSUPkwiGpiLP7rOu', 'coach', 1),
(547, 143, 'coach_masloc', '$2y$10$wyO6MJnvWlx1dVooB1egLuNKmrjM5/0oHd98fZCvygrdymsFO5DQa', 'coach', 1),
(548, 144, 'coach_chan', '$2y$10$X.oPCzezW9t8e25hLaJjH.BYQmPEPtjVZ1m.roQSrMDMyJFruRvFS', 'coach', 1),
(549, 145, 'athlete_are', '$2y$10$1iWN6JEvvKgexEZ2FrB8JOs8OA162iGIlX.1j550562HIrcRWDsRa', 'athlete/player', 1),
(550, 146, 'coach_ching', '$2y$10$gCId0uXSfodkJitmHR2YbunFwZl1IrDtmfg9bTxezrlSPUVhfuiWC', 'coach', 1),
(551, 147, 'athlete_balang', '$2y$10$q8omZ0R1VLuZaBl.VnQD/.Zg/vqS/q446pasDVT5YWKzud7Dcm4vW', 'athlete/player', 1),
(552, 148, 'manager_benesisto', '$2y$10$y2T2Ex6LHWEn0RBKLpXrSe.4txWUc498UwsqPc6kRBJkZKYWz9Lx.', 'Tournament manager', 1),
(553, 149, 'athlete_carpio', '$2y$10$Z3lnpZuTZ5.yWpTgzO/uVODnx8m/J0NUi37gw9a0ymWqqPLXsyQeC', 'athlete/player', 1),
(554, 150, 'athlete_lopez', '$2y$10$e5xQx3KLZTlXAJkyboyFfeScjomKbaW.BYn2udri2L6lW7.LDqHDO', 'athlete/player', 1),
(555, 154, 'belly.garin', '$2y$10$HKdNohs2ifx0K2DPHh3rQ.HtfhRhRYWgVPHofIFHlDCQcXJUjJRdG', 'athlete/player', 1),
(556, 156, 'athlete_francine1', '$2y$10$lqWZ4MYMGlbibKDbZBIhnuVmpz5/00hL4C19QSWh0izrq3.//xDDe', 'athlete/player', 1),
(557, 157, 'athlete_nathaniel1', '$2y$10$DFRtIusmzEDIa4rT96x8oeGA3ZtapEQZVkOoUVIxgXJqihzkryO2K', 'athlete/player', 1),
(558, 158, 'athlete_sabellano1', '$2y$10$lFVH7Dkh7g3TVDPZfWtHIOC7xbtLHoBeGYoVMlncKle2doCjQ/hLG', 'athlete/player', 1),
(559, 159, 'umpire_jomei', '$2y$10$cNF9Eew6Pxfo4gz6Vx72oeZsGrqL36tW/W.l4.MVEEPY/mtaIGPM2', 'umpire', 1),
(560, 160, 'coach_puaso', '$2y$10$.io2E4wbxMmx3B6wSoI8Z.A0QzhUTrNL5n.Zi4Tj/1dWa0E1RxbJS', 'coach', 1),
(561, 161, 'athlete_garin', '$2y$10$4a4LT9LLI4zTbp6W0JX3YOOsj/B7VQHb0WqDRW8kqYwslpdfm4Aw6', 'athlete/player', 1),
(562, 162, 'athlete_jomei', '$2y$10$TF93fnLtuAOBsN72gs8fA.I7QmH8wtgoglUixHJiuDv1oliCEzAZ.', 'athlete/player', 1),
(563, 163, 'athlete_marcel', '$2y$10$cC6K/dFLnaa.fL.Vpt5KCO32iN.h.Ln2RpXWYyc5jli6FcI3TxBlG', 'athlete/player', 1),
(564, 164, 'athlete_lucas', '$2y$10$M6HKxcVLiUi9V8xjqR8FqONN.ILUvrqV5.ePMf8vVuXCs0JUj3EL6', 'athlete/player', 1),
(565, 165, 'athlete_jomei1', '$2y$10$23tpl6GbOv6d/tFJHAYNReYT8ifawpETMQp9RXNtzWrKlXGeVGU6i', 'athlete/player', 1),
(566, 166, 'athlete_jomei2', '$2y$10$bHGxs4QcuQJGUK8q.vHoUOEFQpYDTUQfltmc9wLHF605oGCmQblDC', 'athlete/player', 1),
(567, 167, 'athlete_luna', '$2y$10$yrEbTq0dbHjbf8QbpPGBre6lIyIxxTogKcW0qoH2/UgqbslRBx6hK', 'athlete/player', 1),
(568, 168, 'athlete_leniel', '$2y$10$3Rcxl6U2vFwQ0k1386m8mevDTCZpJpqJbjoBwIZy7q63R5Rl9Bpl.', 'athlete/player', 1),
(569, 169, 'athlete_zed', '$2y$10$qFKGWjl7ooWFWYOLZNpw/.sR5a94U0/XPHgxfKCojQlvODfUMx01e', 'athlete/player', 1),
(570, 170, 'coach_zed', '$2y$10$hzZWJG4vDHyVGDfwCG9d2eGsGhGmcUwK7Flcm6CmRgC59CJUtEH0S', 'coach', 1),
(571, 171, 'athlete_luke', '$2y$10$zcvLxY6QwiorFO1r5gvKn.oSSSTDXns7Hof4F5.LiqMBWL4BiziMu', 'athlete/player', 1),
(572, 172, 'manager_kat', '$2y$10$RcXN5b10G.4mJIgilWIcfuZ4/d.tOYZQtGcFX3aaMWxjIHOscxCWG', 'Tournament manager', 1),
(573, 173, 'athlete_ate', '$2y$10$wSUJofcBt0K./yxBxCVwdu0tVZz1ns3pU0LRPI3JVj.1iQ/k3t3Vy', 'athlete/player', 1),
(574, 174, 'athlete_bryan', '$2y$10$1Ta1QjUoE3BXWTg5ybnrtuvqjUb9fsnMFQ70YyyNL6T2EKdmQRAia', 'athlete/player', 1),
(575, 175, 'athlete_pomeranda', '$2y$10$7hVsxujHonbkYm6XrnPn3uZ50lM4kw6NT7IpXYX25/s36zeTTsU7.', 'athlete/player', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vital_signs`
--

DROP TABLE IF EXISTS `tbl_vital_signs`;
CREATE TABLE IF NOT EXISTS `tbl_vital_signs` (
  `vital_id` int NOT NULL AUTO_INCREMENT,
  `person_id` int NOT NULL,
  `height` decimal(6,2) DEFAULT NULL,
  `weight` decimal(6,2) DEFAULT NULL,
  `b_pressure` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `b_sugar` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `b_choles` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_taken` date NOT NULL,
  PRIMARY KEY (`vital_id`),
  KEY `fk_vital_person` (`person_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_vital_signs`
--

INSERT INTO `tbl_vital_signs` (`vital_id`, `person_id`, `height`, `weight`, `b_pressure`, `b_sugar`, `b_choles`, `date_taken`) VALUES
(1, 1, 170.00, 65.00, '120/80', '90', '180', '2025-01-10'),
(2, 2, 160.00, 55.00, '110/70', '85', '170', '2025-01-10'),
(3, 10, 172.00, 68.00, '118/78', '92', '175', '2025-01-11'),
(4, 11, 158.00, 54.00, '112/72', '88', '168', '2025-01-11'),
(5, 9, 165.00, 57.00, '115/75', '86', '172', '2025-01-12'),
(6, 51, 175.00, 70.00, '120/80', '90', '180', '2025-01-15'),
(7, 52, 165.00, 58.00, '115/75', '88', '175', '2025-01-15'),
(8, 53, 178.00, 72.00, '118/78', '92', '182', '2025-01-15'),
(9, 54, 162.00, 56.00, '112/72', '86', '170', '2025-01-15'),
(10, 55, 172.00, 68.00, '120/80', '90', '178', '2025-01-15'),
(11, 56, 160.00, 54.00, '110/70', '85', '168', '2025-01-15'),
(12, 57, 180.00, 75.00, '122/82', '94', '185', '2025-01-15'),
(13, 58, 168.00, 60.00, '116/76', '89', '172', '2025-01-15'),
(14, 59, 176.00, 71.00, '119/79', '91', '180', '2025-01-15'),
(15, 60, 163.00, 55.00, '113/73', '87', '169', '2025-01-15'),
(16, 74, 168.00, 55.00, '100/120', 'none', 'none', '2026-01-03'),
(19, 77, 168.00, 55.00, '100/120', 'none', 'none', '2026-01-03'),
(20, 78, 168.00, 55.00, '100/120', 'none', 'none', '2026-01-03'),
(23, 81, 168.00, 55.00, '100/120', 'none', 'none', '2026-01-03'),
(24, 82, 168.00, 55.00, '100/120', 'none', 'none', '2026-01-03'),
(26, 84, 178.00, 55.00, '100/120', '89', '180', '2026-01-04'),
(27, 85, 178.00, 55.00, '100/120', '89', '180', '2026-01-04'),
(28, 120, 178.00, 67.00, NULL, NULL, NULL, '2026-01-07'),
(29, 131, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(33, 135, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(34, 136, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(35, 137, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(36, 138, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(37, 139, 178.00, 67.00, NULL, NULL, NULL, '2026-01-08'),
(38, 145, 189.00, 65.00, '100/80', '23', '23', '2026-01-09'),
(40, 152, 170.00, 130.00, NULL, NULL, NULL, '2026-01-09'),
(41, 153, 170.00, 87.00, NULL, NULL, NULL, '2026-01-09'),
(42, 154, 170.00, 67.00, '100/120', 'none', '180', '2026-01-10'),
(43, 155, 190.00, 56.00, NULL, NULL, NULL, '2026-01-11'),
(44, 156, 179.00, 65.00, NULL, NULL, NULL, '2026-01-11'),
(45, 157, 187.00, 67.00, NULL, NULL, NULL, '2026-01-11'),
(46, 158, 179.00, 65.00, '100/120', '89', 'none', '2026-01-12'),
(47, 161, 170.00, 70.00, '120/80', '78', NULL, '2026-01-13'),
(48, 162, 170.00, NULL, NULL, NULL, NULL, '2026-01-13'),
(49, 163, 170.00, 67.00, NULL, NULL, NULL, '2026-01-14'),
(50, 164, 170.00, 67.00, NULL, NULL, NULL, '2026-01-14'),
(51, 165, 130.00, 56.00, NULL, NULL, NULL, '2026-01-14'),
(52, 166, 130.00, 56.00, NULL, NULL, NULL, '2026-01-14'),
(53, 167, 345.00, 34.00, NULL, NULL, NULL, '2026-01-14'),
(54, 168, 5.00, 6.00, NULL, NULL, NULL, '2026-01-15'),
(55, 173, 170.00, 170.00, NULL, NULL, NULL, '2026-01-15');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_ath_status`
--
ALTER TABLE `tbl_ath_status`
  ADD CONSTRAINT `fk_status_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_comp_score`
--
ALTER TABLE `tbl_comp_score`
  ADD CONSTRAINT `fk_score_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_score_match` FOREIGN KEY (`match_id`) REFERENCES `tbl_match` (`match_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_score_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_score_tour` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_course`
--
ALTER TABLE `tbl_course`
  ADD CONSTRAINT `fk_course_dept` FOREIGN KEY (`dept_id`) REFERENCES `tbl_department` (`dept_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tbl_department`
--
ALTER TABLE `tbl_department`
  ADD CONSTRAINT `fk_dept_college` FOREIGN KEY (`college_id`) REFERENCES `tbl_college` (`college_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tbl_equip_inventory`
--
ALTER TABLE `tbl_equip_inventory`
  ADD CONSTRAINT `fk_inv_equip` FOREIGN KEY (`equip_id`) REFERENCES `tbl_team_equipment` (`equip_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inv_recrelby` FOREIGN KEY (`rec_rel_by`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inv_transby` FOREIGN KEY (`trans_by`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_logs`
--
ALTER TABLE `tbl_logs`
  ADD CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tbl_match`
--
ALTER TABLE `tbl_match`
  ADD CONSTRAINT `fk_match_manager` FOREIGN KEY (`match_sports_manager_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_teama` FOREIGN KEY (`team_a_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_teamb` FOREIGN KEY (`team_b_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_tour` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_umpire` FOREIGN KEY (`match_umpire_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_venue` FOREIGN KEY (`venue_id`) REFERENCES `tbl_game_venue` (`venue_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_winner_athlete` FOREIGN KEY (`winner_athlete_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_match_winner_team` FOREIGN KEY (`winner_team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_match_participants`
--
ALTER TABLE `tbl_match_participants`
  ADD CONSTRAINT `tbl_match_participants_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `tbl_match` (`match_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_match_participants_ibfk_2` FOREIGN KEY (`athlete_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_person`
--
ALTER TABLE `tbl_person`
  ADD CONSTRAINT `fk_person_collegecode` FOREIGN KEY (`college_code`) REFERENCES `tbl_college` (`college_code`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_sports_team`
--
ALTER TABLE `tbl_sports_team`
  ADD CONSTRAINT `fk_spteam_asstcoach` FOREIGN KEY (`asst_coach_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_coach` FOREIGN KEY (`coach_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_tour` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_trainor1` FOREIGN KEY (`trainor1_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_trainor2` FOREIGN KEY (`trainor2_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spteam_trainor3` FOREIGN KEY (`trainor3_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tournament_manager` FOREIGN KEY (`tournament_manager_id`) REFERENCES `tbl_person` (`person_id`);

--
-- Constraints for table `tbl_team`
--
ALTER TABLE `tbl_team`
  ADD CONSTRAINT `fk_team_school` FOREIGN KEY (`school_id`) REFERENCES `tbl_school` (`school_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tbl_team_athletes`
--
ALTER TABLE `tbl_team_athletes`
  ADD CONSTRAINT `fk_ta_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ta_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ta_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ta_tour` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_team_colleges`
--
ALTER TABLE `tbl_team_colleges`
  ADD CONSTRAINT `tbl_team_colleges_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_team_colleges_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_team_colleges_ibfk_3` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_team_colleges_ibfk_4` FOREIGN KEY (`college_code`) REFERENCES `tbl_college` (`college_code`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_team_equipment`
--
ALTER TABLE `tbl_team_equipment`
  ADD CONSTRAINT `fk_equipment_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_team_standing`
--
ALTER TABLE `tbl_team_standing`
  ADD CONSTRAINT `fk_stand_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stand_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stand_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stand_tour` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_team_trainees`
--
ALTER TABLE `tbl_team_trainees`
  ADD CONSTRAINT `fk_team_trainees_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_teamtrainees_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teamtrainees_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_tournament_sports_selection`
--
ALTER TABLE `tbl_tournament_sports_selection`
  ADD CONSTRAINT `tbl_tournament_sports_selection_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tbl_tournament` (`tour_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_tournament_sports_selection_ibfk_2` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_training_activity`
--
ALTER TABLE `tbl_training_activity`
  ADD CONSTRAINT `fk_activity_sports` FOREIGN KEY (`sports_id`) REFERENCES `tbl_sports` (`sports_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `tbl_train_attend`
--
ALTER TABLE `tbl_train_attend`
  ADD CONSTRAINT `fk_attend_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_attend_sked` FOREIGN KEY (`sked_id`) REFERENCES `tbl_train_sked` (`sked_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_train_perf`
--
ALTER TABLE `tbl_train_perf`
  ADD CONSTRAINT `fk_perf_activity` FOREIGN KEY (`activitity_id`) REFERENCES `tbl_training_activity` (`activity_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perf_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perf_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tbl_train_sked`
--
ALTER TABLE `tbl_train_sked`
  ADD CONSTRAINT `fk_sked_team` FOREIGN KEY (`team_id`) REFERENCES `tbl_team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD CONSTRAINT `fk_users_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_vital_signs`
--
ALTER TABLE `tbl_vital_signs`
  ADD CONSTRAINT `fk_vital_person` FOREIGN KEY (`person_id`) REFERENCES `tbl_person` (`person_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
