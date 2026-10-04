-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: lilly_memes
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned NOT NULL,
  `action` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_admin_log_user` (`admin_id`),
  CONSTRAINT `fk_admin_log_user` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
INSERT INTO `admin_logs` VALUES (1,2,'CREATE_MEME','Created meme: lll','::1','2026-10-03 11:34:39'),(2,2,'CREATE_MEME','Created meme: win11','::1','2026-10-03 12:15:44'),(3,2,'payment_approved','Approved payment #2 for Daily (500.00 MWK).','::1','2026-10-04 10:34:27'),(4,2,'payment_approved','Approved payment #1 for Daily (500.00 MWK).','::1','2026-10-04 10:35:15'),(5,2,'subscription_cancelled','Cancelled 1 active subscription(s) for member #4 (tisu).','::1','2026-10-04 10:38:17'),(6,2,'subscription_extended','Extended subscription #3 for member #5 (KHUYU) by 30 days.','::1','2026-10-04 10:45:58'),(7,2,'subscription_reactivated','Reactivated subscription #2 for member #4 (tisu).','::1','2026-10-04 10:46:16'),(8,2,'payment_approved','Approved payment #3 for Monthly (7000.00 MWK).','::1','2026-10-04 10:56:00'),(9,2,'story_created','Published image story #1, expires in 24 hours.','::1','2026-10-04 11:05:07'),(10,2,'member_verified','Verified member #6 (mit)','::1','2026-10-04 11:15:08'),(11,2,'payment_approved','Approved payment #4 for Weekly (2500.00 MWK).','::1','2026-10-04 11:16:59'),(12,2,'payment_approved','Approved payment #5 for Weekly (2500.00 MWK).','::1','2026-10-04 11:50:36'),(13,2,'CREATE_MEME','Created meme: TESTING','::1','2026-10-04 11:52:46'),(14,2,'story_created','Published image story #2, expires in 24 hours.','::1','2026-10-04 11:59:27'),(15,2,'payment_approved','Approved payment #6 for Monthly (7000.00 MWK).','::1','2026-10-04 13:32:05'),(16,2,'payment_approved','Approved payment #7 for Weekly (2500.00 MWK).','::1','2026-10-04 17:34:20'),(17,2,'story_created','Published image story #3, expires in 24 hours.','::1','2026-10-04 17:46:29');
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Funny','Funny and hilarious memes',NULL,1,'2026-10-03 10:36:11'),(2,'Relationships','Relationship and dating memes',NULL,1,'2026-10-03 10:36:11'),(3,'School','School and university memes',NULL,1,'2026-10-03 10:36:11'),(4,'Malawi','Malawian memes',NULL,1,'2026-10-03 10:36:11'),(5,'Sports','Sports related memes',NULL,1,'2026-10-03 10:36:11'),(6,'Entertainment','Entertainment and celebrity memes',NULL,1,'2026-10-03 10:36:11'),(7,'Work','Work and workplace memes',NULL,1,'2026-10-03 10:36:11'),(8,'Trending','Currently trending memes',NULL,1,'2026-10-03 10:36:11'),(9,'Random','Random memes',NULL,1,'2026-10-03 10:36:11');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_likes`
--

DROP TABLE IF EXISTS `comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `comment_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_comment_like` (`user_id`,`comment_id`),
  KEY `fk_comment_likes_comment` (`comment_id`),
  CONSTRAINT `fk_comment_likes_comment` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_likes`
--

LOCK TABLES `comment_likes` WRITE;
/*!40000 ALTER TABLE `comment_likes` DISABLE KEYS */;
INSERT INTO `comment_likes` VALUES (2,1,2,'2026-10-03 19:42:21'),(3,1,1,'2026-10-03 19:42:26'),(4,4,7,'2026-10-04 02:49:21'),(5,4,13,'2026-10-04 02:50:05'),(7,4,1,'2026-10-04 03:01:22'),(8,1,13,'2026-10-04 03:26:17'),(9,5,13,'2026-10-04 09:53:16'),(10,7,7,'2026-10-04 12:01:06');
/*!40000 ALTER TABLE `comment_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `meme_id` int unsigned NOT NULL,
  `parent_id` int unsigned DEFAULT NULL,
  `comment_text` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comment_user` (`user_id`),
  KEY `fk_comment_meme` (`meme_id`),
  KEY `fk_comment_parent` (`parent_id`),
  CONSTRAINT `fk_comment_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,1,1,NULL,'kjkjkjk',0,'2026-10-03 11:57:05','2026-10-03 11:57:05'),(2,1,1,NULL,'@jvm',0,'2026-10-03 11:57:26','2026-10-03 11:57:26'),(3,1,1,NULL,'@jvm kjkjkjkjkj',0,'2026-10-03 11:59:32','2026-10-03 11:59:32'),(4,1,1,1,'@jvm jjjjjj',0,'2026-10-03 12:04:02','2026-10-03 12:04:02'),(5,1,1,4,'@jvm no way',0,'2026-10-03 16:59:05','2026-10-03 16:59:05'),(6,1,1,2,'@jvm seriou',0,'2026-10-03 17:06:16','2026-10-03 17:06:16'),(7,1,2,NULL,'BAD',0,'2026-10-03 19:00:00','2026-10-03 19:00:00'),(8,1,2,7,'@jvm NOOO',0,'2026-10-03 19:00:11','2026-10-03 19:00:11'),(9,1,2,7,'HJHHJJ',0,'2026-10-03 19:19:57','2026-10-03 19:19:57'),(10,1,2,8,'JJ',0,'2026-10-03 19:20:13','2026-10-03 19:20:13'),(11,1,1,2,'nooo',0,'2026-10-03 19:47:46','2026-10-03 19:47:46'),(12,1,1,2,'hhh',0,'2026-10-03 19:48:02','2026-10-03 19:48:02'),(13,4,2,NULL,'like me',0,'2026-10-04 02:49:43','2026-10-04 02:49:43'),(14,5,2,8,'testing testing, this was hghgh i know sngamve',0,'2026-10-04 09:55:11','2026-10-04 09:55:11');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `downloads`
--

DROP TABLE IF EXISTS `downloads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `downloads` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `meme_id` int unsigned NOT NULL,
  `downloaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_download_user` (`user_id`),
  KEY `fk_download_meme` (`meme_id`),
  CONSTRAINT `fk_download_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_download_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `downloads`
--

LOCK TABLES `downloads` WRITE;
/*!40000 ALTER TABLE `downloads` DISABLE KEYS */;
INSERT INTO `downloads` VALUES (1,1,1,'2026-10-03 16:51:31'),(2,1,1,'2026-10-03 16:51:37'),(3,1,1,'2026-10-03 16:51:47'),(4,1,1,'2026-10-03 17:02:39'),(5,1,1,'2026-10-03 17:05:06'),(6,1,1,'2026-10-03 17:05:10'),(7,1,1,'2026-10-03 17:05:10'),(8,1,1,'2026-10-03 17:05:11'),(9,1,1,'2026-10-03 17:05:11'),(10,1,1,'2026-10-03 17:05:11'),(11,1,2,'2026-10-03 19:20:28'),(12,1,2,'2026-10-04 03:50:19');
/*!40000 ALTER TABLE `downloads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `meme_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_meme_like` (`user_id`,`meme_id`),
  KEY `fk_like_meme` (`meme_id`),
  CONSTRAINT `fk_like_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (5,1,2,'2026-10-03 18:59:40'),(6,1,1,'2026-10-03 19:54:25'),(7,5,1,'2026-10-04 09:53:00'),(8,5,2,'2026-10-04 09:53:07'),(9,7,2,'2026-10-04 12:01:15');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_messages`
--

DROP TABLE IF EXISTS `member_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unread','read','replied','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unread',
  `admin_reply` text COLLATE utf8mb4_unicode_ci,
  `replied_by` int unsigned DEFAULT NULL,
  `replied_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_member_messages_user` (`user_id`),
  KEY `fk_member_messages_admin` (`replied_by`),
  CONSTRAINT `fk_member_messages_admin` FOREIGN KEY (`replied_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_member_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_messages`
--

LOCK TABLES `member_messages` WRITE;
/*!40000 ALTER TABLE `member_messages` DISABLE KEYS */;
INSERT INTO `member_messages` VALUES (1,1,'i ned','VCVC','unread',NULL,NULL,NULL,'2026-10-04 17:45:27','2026-10-04 17:45:27');
/*!40000 ALTER TABLE `member_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meme_categories`
--

DROP TABLE IF EXISTS `meme_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meme_categories` (
  `meme_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  PRIMARY KEY (`meme_id`,`category_id`),
  KEY `fk_meme_category_category` (`category_id`),
  CONSTRAINT `fk_meme_category_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_meme_category_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meme_categories`
--

LOCK TABLES `meme_categories` WRITE;
/*!40000 ALTER TABLE `meme_categories` DISABLE KEYS */;
INSERT INTO `meme_categories` VALUES (1,2),(2,3),(3,8);
/*!40000 ALTER TABLE `meme_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meme_views`
--

DROP TABLE IF EXISTS `meme_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meme_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `meme_id` int unsigned NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_view_user` (`user_id`),
  KEY `fk_view_meme` (`meme_id`),
  CONSTRAINT `fk_view_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_view_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meme_views`
--

LOCK TABLES `meme_views` WRITE;
/*!40000 ALTER TABLE `meme_views` DISABLE KEYS */;
INSERT INTO `meme_views` VALUES (1,1,1,'::1','2026-10-03 11:56:52'),(2,1,1,'::1','2026-10-03 11:59:09'),(3,NULL,1,'::1','2026-10-03 12:03:33'),(4,1,1,'::1','2026-10-03 12:03:50'),(5,1,1,'::1','2026-10-03 12:05:13'),(6,1,1,'::1','2026-10-03 12:38:00'),(7,NULL,1,'::1','2026-10-03 12:38:35'),(8,2,1,'::1','2026-10-03 13:02:15'),(9,1,1,'::1','2026-10-03 16:44:18'),(10,1,1,'::1','2026-10-03 16:58:51'),(11,1,1,'::1','2026-10-03 17:01:29'),(12,NULL,1,'::1','2026-10-03 17:02:04'),(13,1,1,'::1','2026-10-03 17:02:38'),(14,NULL,1,'::1','2026-10-03 17:04:37'),(15,1,1,'::1','2026-10-03 17:05:05'),(16,NULL,1,'::1','2026-10-03 17:14:34'),(17,1,1,'::1','2026-10-03 18:59:20'),(18,1,2,'::1','2026-10-03 18:59:43'),(19,1,2,'::1','2026-10-03 19:07:45'),(20,1,2,'::1','2026-10-03 19:09:05'),(21,1,1,'::1','2026-10-03 19:09:26'),(22,NULL,1,'::1','2026-10-03 19:10:40'),(23,NULL,1,'::1','2026-10-03 19:12:27'),(24,NULL,1,'::1','2026-10-03 19:16:22'),(25,NULL,1,'::1','2026-10-03 19:19:28'),(26,1,2,'::1','2026-10-03 19:19:48'),(27,1,1,'::1','2026-10-03 19:40:10'),(28,1,1,'::1','2026-10-03 19:41:44'),(29,1,1,'::1','2026-10-03 19:46:59'),(30,1,1,'::1','2026-10-03 19:48:12'),(31,1,1,'::1','2026-10-03 19:51:52'),(32,1,2,'::1','2026-10-03 19:54:16'),(33,1,1,'::1','2026-10-03 19:54:27'),(34,4,2,'::1','2026-10-04 02:49:15'),(35,4,1,'::1','2026-10-04 02:49:50'),(36,4,2,'::1','2026-10-04 02:49:58'),(37,4,2,'::1','2026-10-04 02:50:17'),(38,1,2,'::1','2026-10-04 02:53:18'),(39,1,2,'::1','2026-10-04 02:53:49'),(40,1,2,'::1','2026-10-04 02:53:56'),(41,4,1,'::1','2026-10-04 03:01:15'),(42,4,2,'::1','2026-10-04 03:01:43'),(43,1,2,'::1','2026-10-04 03:26:09'),(44,4,2,'::1','2026-10-04 03:26:50'),(45,4,2,'::1','2026-10-04 03:46:24'),(46,5,2,'::1','2026-10-04 09:53:09'),(47,7,2,'::1','2026-10-04 12:00:43');
/*!40000 ALTER TABLE `meme_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memes`
--

DROP TABLE IF EXISTS `memes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `memes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `view_count` int unsigned NOT NULL DEFAULT '0',
  `download_count` int unsigned NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_meme_user` (`user_id`),
  CONSTRAINT `fk_meme_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memes`
--

LOCK TABLES `memes` WRITE;
/*!40000 ALTER TABLE `memes` DISABLE KEYS */;
INSERT INTO `memes` VALUES (1,2,'lll','nnn','1791027279691-ed969c3bfc0e968c.jpg',30,10,0,1,'2026-10-03 11:34:39','2026-10-04 03:01:15'),(2,2,'win11',NULL,'1791029744110-806a6f6c6e20841c.png',4,2,0,1,'2026-10-03 12:15:44','2026-10-04 12:00:43'),(3,2,'TESTING','HAHAHAHHA','1791114765908-8182e931a3e270bb.png',0,0,1,1,'2026-10-04 11:52:45','2026-10-04 11:52:45');
/*!40000 ALTER TABLE `memes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_id` int unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notification_user` (`user_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'comment_like','Someone liked your comment','tisu liked your comment.',7,1,'2026-10-04 02:49:21'),(2,2,'meme_comment','New comment on your meme','tisu commented on your meme.',2,1,'2026-10-04 02:49:43'),(3,4,'comment_like','Someone liked your comment','jvm liked your comment.',13,0,'2026-10-04 02:53:35'),(4,1,'comment_like','Someone liked your comment','tisu liked your comment.',1,1,'2026-10-04 03:01:22'),(5,4,'comment_like','Someone liked your comment','jvm liked your comment.',13,0,'2026-10-04 03:26:17'),(6,2,'meme_like','Someone liked your meme','KHUYU liked your meme.',1,1,'2026-10-04 09:53:00'),(7,2,'meme_like','Someone liked your meme','KHUYU liked your meme.',2,1,'2026-10-04 09:53:07'),(8,4,'comment_like','Someone liked your comment','KHUYU liked your comment.',13,0,'2026-10-04 09:53:16'),(9,2,'comment_reply','Someone replied to a comment','KHUYU replied to a comment on your meme.',2,1,'2026-10-04 09:55:11'),(10,1,'comment_reply','Someone replied to your comment','KHUYU replied to your comment.',2,0,'2026-10-04 09:55:11'),(11,5,'subscription','Payment Approved','Your Daily subscription has been activated successfully.',3,0,'2026-10-04 10:34:27'),(12,4,'subscription','Payment Approved','Your Daily subscription has been activated successfully.',2,0,'2026-10-04 10:35:15'),(13,4,'subscription','Subscription Cancelled','Your subscription has been cancelled by an administrator, and access has ended.',4,0,'2026-10-04 10:38:17'),(14,5,'subscription','Subscription Extended','Your subscription has been extended by 30 days.',3,0,'2026-10-04 10:45:58'),(15,4,'subscription','Subscription Reactivated','Your subscription has been reactivated. Access is restored until its original expiry date.',2,0,'2026-10-04 10:46:16'),(16,2,'subscription','Payment Approved','Your Monthly subscription has been activated successfully.',4,1,'2026-10-04 10:56:00'),(17,6,'account','Account Verified','Your Lilly Memes account has been verified. You can now use your member account.',6,0,'2026-10-04 11:15:08'),(18,6,'subscription','Payment Approved','Your Weekly subscription has been activated successfully.',5,0,'2026-10-04 11:16:59'),(19,7,'subscription','Payment Approved','Your Weekly subscription has been activated successfully.',6,0,'2026-10-04 11:50:36'),(20,1,'comment_like','Someone liked your comment','HP1 liked your comment.',7,0,'2026-10-04 12:01:06'),(21,2,'meme_like','Someone liked your meme','HP1 liked your meme.',2,1,'2026-10-04 12:01:15'),(22,8,'subscription','Payment Approved','Your Monthly subscription has been activated successfully.',7,0,'2026-10-04 13:32:05'),(23,1,'subscription','Payment Approved','Your Weekly subscription has been activated successfully.',1,0,'2026-10-04 17:34:20');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `subscription_id` int unsigned DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MWK',
  `payment_method` enum('airtel_money','tnm_mpamba','malipo','bank','cash','manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_reference` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','successful','failed','rejected','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `verified_by` int unsigned DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payment_user` (`user_id`),
  KEY `fk_payment_subscription` (`subscription_id`),
  KEY `fk_payment_verified_by` (`verified_by`),
  CONSTRAINT `fk_payment_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payment_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,4,2,500.00,'MWK','airtel_money','jjjjjjj','9999999','successful',2,'2026-10-04 12:35:15','2026-10-04 05:18:50'),(2,5,3,500.00,'MWK','tnm_mpamba','nnnn','55555','successful',2,'2026-10-04 12:34:27','2026-10-04 10:01:06'),(3,2,4,7000.00,'MWK','airtel_money','kjjjjjjj','888888','successful',2,'2026-10-04 12:56:00','2026-10-04 10:55:32'),(4,6,5,2500.00,'MWK','manual','5555','888888','successful',2,'2026-10-04 13:16:59','2026-10-04 11:16:01'),(5,7,6,2500.00,'MWK','tnm_mpamba','KKKKKH','KKHH','successful',2,'2026-10-04 13:50:36','2026-10-04 11:50:00'),(6,8,7,7000.00,'MWK','airtel_money','HHHHHHH','JJJJJJ','successful',2,'2026-10-04 15:32:05','2026-10-04 13:31:41'),(7,1,1,2500.00,'MWK','tnm_mpamba','sdvv','rrr','successful',2,'2026-10-04 19:34:20','2026-10-04 17:33:21');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MWK',
  `duration_days` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES (1,'Daily','Access Lilly Memes for one day.',500.00,'MWK',1,1,'2026-10-03 10:36:11'),(2,'Weekly','Access Lilly Memes for seven days.',2500.00,'MWK',7,1,'2026-10-03 10:36:11'),(3,'Monthly','Access Lilly Memes for thirty days.',7000.00,'MWK',30,1,'2026-10-03 10:36:11');
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `report_type` enum('meme','comment','user','story') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int unsigned NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` int unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_report_user` (`user_id`),
  KEY `fk_report_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_report_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_memes`
--

DROP TABLE IF EXISTS `saved_memes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_memes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `meme_id` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_saved_meme` (`user_id`,`meme_id`),
  KEY `fk_saved_meme` (`meme_id`),
  CONSTRAINT `fk_saved_meme` FOREIGN KEY (`meme_id`) REFERENCES `memes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_memes`
--

LOCK TABLES `saved_memes` WRITE;
/*!40000 ALTER TABLE `saved_memes` DISABLE KEYS */;
INSERT INTO `saved_memes` VALUES (1,1,1,'2026-10-03 12:05:03');
/*!40000 ALTER TABLE `saved_memes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES (1,'20261004_member_messages.sql','2026-10-04 18:08:24');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES (1,'site_name','Lilly Memes','2026-10-03 10:36:11'),(2,'site_description','Your Daily Dose of Memes','2026-10-03 10:36:11'),(3,'story_duration_hours','24','2026-10-03 10:36:11'),(4,'max_comment_length','500','2026-10-03 10:36:11'),(5,'max_meme_file_size_mb','10','2026-10-03 10:36:11');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stories`
--

DROP TABLE IF EXISTS `stories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `media_type` enum('image','video') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `media` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_story_user` (`user_id`),
  CONSTRAINT `fk_story_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stories`
--

LOCK TABLES `stories` WRITE;
/*!40000 ALTER TABLE `stories` DISABLE KEYS */;
INSERT INTO `stories` VALUES (1,2,'image','1791111907771-c760d7853ee6443b.jpg','now','2026-10-05 13:05:07',1,'2026-10-04 11:05:07'),(2,2,'image','1791115167433-683001848a0c514f.png','CVCVC','2026-10-05 13:59:27',1,'2026-10-04 11:59:27'),(3,2,'image','1791135989570-d7d20f8820468977.png','FVCVC','2026-10-05 19:46:29',1,'2026-10-04 17:46:29');
/*!40000 ALTER TABLE `stories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `story_views`
--

DROP TABLE IF EXISTS `story_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `story_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `story_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_story_viewer` (`story_id`,`user_id`),
  KEY `fk_story_view_user` (`user_id`),
  CONSTRAINT `fk_story_view_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_story_view_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `story_views`
--

LOCK TABLES `story_views` WRITE;
/*!40000 ALTER TABLE `story_views` DISABLE KEYS */;
/*!40000 ALTER TABLE `story_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `plan_id` int unsigned NOT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` enum('pending','active','expired','cancelled','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_subscription_user` (`user_id`),
  KEY `fk_subscription_plan` (`plan_id`),
  CONSTRAINT `fk_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,1,2,'2026-10-04 19:34:20','2026-10-11 19:34:20','active','2026-10-03 16:41:37','2026-10-04 17:34:20'),(2,4,1,'2026-10-04 12:35:15','2026-10-05 12:35:15','active','2026-10-04 05:18:30','2026-10-04 10:46:16'),(3,5,1,'2026-10-04 12:34:27','2026-11-04 12:34:27','active','2026-10-04 10:00:53','2026-10-04 10:45:58'),(4,2,3,'2026-10-04 12:56:00','2026-11-03 12:56:00','active','2026-10-04 10:55:12','2026-10-04 10:56:00'),(5,6,2,'2026-10-04 13:16:59','2026-10-11 13:16:59','active','2026-10-04 11:15:49','2026-10-04 11:16:59'),(6,7,2,'2026-10-04 13:50:36','2026-10-11 13:50:36','active','2026-10-04 11:49:48','2026-10-04 11:50:36'),(7,8,3,'2026-10-04 15:32:05','2026-11-03 15:32:05','active','2026-10-04 13:31:21','2026-10-04 13:32:05');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('member','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `status` enum('active','suspended','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'jvm','justinmithi4@gmail.com','$2b$12$.bcZKUnqB.lB8oSeQ8QyiOLvApmpLNpPOEerrskG2v9cnWWlZX47m','JUSTIN MITHI',NULL,'member','active',0,'2026-10-03 10:50:39','2026-10-03 10:50:39'),(2,'admin','admin@lillymemes.com','$2b$12$fp2HOpmIj4aNADLcLpeN9OdP4Jk4O35JQJ8XuBmAuMxMpfBYM63mS','Lilly Memes Administrator',NULL,'admin','active',1,'2026-10-03 10:55:36','2026-10-03 10:55:36'),(3,'mithi','mithi4@gmail.com','$2b$12$2PAMCmcHGJaCHr6Hf3O8K.CTX75txuAd0u2jvm/1HrUexnbZCrFEG','JUSTIN MITHI',NULL,'member','active',0,'2026-10-03 12:39:24','2026-10-03 12:39:24'),(4,'tisu','tisu@gmail.com','$2b$12$KmbYZFX.mqIEUpWt0lbBfe7.BBSgqm4AAMIRz6oO9qb2h.ayAqIEG','TISUNGE',NULL,'member','active',0,'2026-10-04 02:48:49','2026-10-04 02:48:49'),(5,'KHUYU','k@gmail.com','$2b$12$mqPiSiI.aLPP8J/oYmCkk.X2YnNC3BBkd4XUkCrai2dzzdjDPHdVO','KHUYU',NULL,'member','active',0,'2026-10-04 09:52:37','2026-10-04 09:52:37'),(6,'mit','mithi@gmail.com','$2b$12$UA4tqDj56IB7Ev/pfcV84uh2o7zqe7EQM0ByI/O.qQ0WA8zC4EQQW','mithi',NULL,'member','active',0,'2026-10-04 11:14:07','2026-10-04 11:15:08'),(7,'HP1','hp@hmail.com','$2b$12$hGQyGPjuoSfRb5uAxCT35.SNjn3/bo/aVwAkjlvJ48ETtc9Y04RI6','HP',NULL,'member','active',0,'2026-10-04 11:42:37','2026-10-04 11:50:36'),(8,'HUU','HU@GMAIL.COM','$2b$12$JTfTIT6mc1FFc.P2ydjZm.EYTn75gt/uS4cY6lAH6Tvv1gf696q8u','HU',NULL,'member','active',0,'2026-10-04 13:31:10','2026-10-04 13:32:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-04 20:11:13
