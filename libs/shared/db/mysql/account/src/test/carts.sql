CREATE TABLE `carts` (
  `id` binary(16) NOT NULL,
  `uid` binary(16) DEFAULT NULL,
  `state` enum('start','processing','success','fail') COLLATE utf8mb4_bin NOT NULL,
  `errorReasonId` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `offeringConfigId` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `interval` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `experiment` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `taxAddress` json DEFAULT NULL,
  `createdAt` bigint unsigned NOT NULL,
  `updatedAt` bigint unsigned NOT NULL,
  `couponCode` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `stripeCustomerId` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `accounts` (`uid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;