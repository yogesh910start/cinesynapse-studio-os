variable "project_id" { type = string }
variable "region" { type = string, default = "us-central1" }
variable "service_name" { type = string, default = "cinesynapse-studio-os" }
variable "environment" { type = string, default = "production" }
variable "container_image" { type = string }
variable "min_instances" { type = number, default = 2 }
variable "max_instances" { type = number, default = 50 }
variable "cpu_allocation" { type = string, default = "4000m" }
variable "memory_allocation" { type = string, default = "8Gi" }
variable "clickhouse_host" { type = string, default = "clickhouse.cloud.internal" }
