terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_cloud_run_v2_service" "studio_os" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = var.cpu_allocation
          memory = var.memory_allocation
        }
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }
      env {
        name  = "CLICKHOUSE_HOST"
        value = var.clickhouse_host
      }
      env {
        name  = "GEMINI_MODEL_ID"
        value = "gemini-1.5-pro"
      }
    }
  }
}

resource "google_storage_bucket" "c2c_vault" {
  name          = "${var.project_id}-c2c-vault"
  location      = var.region
  force_destroy = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}
