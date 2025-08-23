# Specification overview

Our application is defined by a specification, which is a collection of markdown files across a specific directory structure. These files will be referenced by an engineer when building the application. They should not contain literal code, because the application may be implemented in a specific language based on company requirements. The specification files should be sufficiently detailed that two developers building the final code will produce functionally equivalent results.

# Specification directory structure

- spec/components/some-component.md
- spec/components/app.md (this is the main app page)
- spec/api/queries/query-name.md
- spec/api/mutations/mutation-name.md
- spec/database-schema.md

# Components

Components represent visual interfaces. Describe in detail their structure, layout, and styling. Additionally, interactions should be defined, and can lead to API calls or other state changes.

# API

API endpoints can be called by components to perform backend operations on the server. These operations can read and write the database.

An API endpoint can be a query or a mutation.

## **Queries**

Use queries when you need to:

- **Read data from the database** without making any changes

**Key characteristics:**

- Read-only operations
- Must be deterministic (no random values or external API calls)

## **Mutations**

Use mutations when you need to:

- **Write, update, or delete data** in the database

**Key characteristics:**

- Can read and write to the database
- Automatically run as ACID transactions (all changes commit together or roll back)

# Database schema

The database schema defines the structure of tables in the database. Each table should be defined in the following format:

Table: SomeTableName (must be ClassCase)

- Column: id (primary key, integer, auto increment)
- Column: name (string)
- ...
