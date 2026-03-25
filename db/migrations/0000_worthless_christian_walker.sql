CREATE TABLE `connection_requests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`match_id` bigint unsigned NOT NULL,
	`from_user_id` int NOT NULL,
	`to_user_id` int NOT NULL,
	`status` enum('pending','accepted','rejected') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `connection_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `item_verification_questions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`item_id` bigint unsigned NOT NULL,
	`user_id` int NOT NULL,
	`question1` varchar(255) DEFAULT '',
	`answer1` varchar(255) DEFAULT '',
	`question2` varchar(255) DEFAULT '',
	`answer2` varchar(255) DEFAULT '',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `item_verification_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`type` enum('lost','found') NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('electronics','accessories','documents','bags','keys','clothing','jewelry','other') NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`time` varchar(10) DEFAULT '',
	`contact_method` enum('email','phone','both') DEFAULT 'email',
	`reward` decimal(10,2) DEFAULT '0',
	`current_location` varchar(255) DEFAULT '',
	`status` enum('active','resolved','expired') DEFAULT 'active',
	`user_id` int NOT NULL,
	`user_name` varchar(50) NOT NULL,
	`image` varchar(500) DEFAULT '',
	`has_identification` boolean DEFAULT false,
	`urgent_return` boolean DEFAULT false,
	`damaged_item` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `match_verification_attempts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`match_id` bigint unsigned NOT NULL,
	`user_id` int NOT NULL,
	`attempts` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `match_verification_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`lost_item_id` bigint unsigned NOT NULL,
	`found_item_id` bigint unsigned NOT NULL,
	`lost_user_id` int NOT NULL,
	`found_user_id` int NOT NULL,
	`lost_item_name` varchar(100) NOT NULL,
	`found_item_name` varchar(100) NOT NULL,
	`score` int NOT NULL,
	`status` enum('potential','verification_pending','verification_failed','request_pending','request_accepted','request_rejected','connected') DEFAULT 'potential',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`otp` varchar(6) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`refresh_token` varchar(512) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`email` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`phone` varchar(20) DEFAULT '',
	`avatar` varchar(10) DEFAULT '👤',
	`email_verified` boolean DEFAULT false,
	`phone_verified` boolean DEFAULT false,
	`member_since` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `connection_requests` ADD CONSTRAINT `connection_requests_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_verification_questions` ADD CONSTRAINT `item_verification_questions_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `match_verification_attempts` ADD CONSTRAINT `match_verification_attempts_match_id_matches_id_fk` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_lost_item_id_items_id_fk` FOREIGN KEY (`lost_item_id`) REFERENCES `items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matches` ADD CONSTRAINT `matches_found_item_id_items_id_fk` FOREIGN KEY (`found_item_id`) REFERENCES `items`(`id`) ON DELETE cascade ON UPDATE no action;