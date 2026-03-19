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
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
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
