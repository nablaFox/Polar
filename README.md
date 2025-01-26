# Polar CLI

The Polar Command Line Interface (CLI) Tools can be used to deploy and manage nodejs applications on AWS EC2 instances.

## Installation

```bash
git clone https://github.com/nablaFox/Polar
cd Polar
npm i -g .
```

This installs the globally accessible `polar` command.

## Setup

```bash
polar config [aws-credentials] [instance-id]
```

If no instance ID is provided, a new EC2 instance will be created.

## Usage

### 1. Initialize the project

At your project root, run:

```bash
polar init
```

this generates a `polar.yml` file with configurable options:

- `project`: the project name
- `cmd`: the command to run (default: npm start)

### 2. Deploy your project

```bash
polar deploy
```

## Commands Overview

- `polar list` – List available projects.
- `polar start [project]` – Start a project.
- `polar stop [project]` – Stop a project.
- `polar instance --off` – Turn off the EC2 instance.
- `polar instance --on` – Turn on the EC2 instance.
- `polar instance --status` – Check the EC2 instance status.
