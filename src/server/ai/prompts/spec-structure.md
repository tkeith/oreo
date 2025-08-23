# Specification overview

Our application is defined by a specification, which is a collection of markdown files across a specific directory structure. These files will be referenced by an engineer when building the application. They should not contain literal code, because the application may be implemented in a specific language based on company requirements. The specification files should be sufficiently detailed that two developers building the final code will produce functionally equivalent results.

# Specification directory structure

- spec/components/some-component.md
- spec/components/app.md (this is the main app page)
- spec/api/endpoint-name.md
- spec/database-schema.md

# Components

Components represent visual interfaces. Describe in detail their structure, layout, and styling. Additionally, interactions should be defined, and can lead to API calls or other state changes.

# API

API endpoints can be called by components to perform backend operations on the server. These operations can read and write the database.

# Database schema

The database schema defines the structure of tables in the database. Each table should be defined in the following format:

Table: SomeTableName (must be ClassCase)

- Column: id (primary key, integer, auto increment)
- Column: name (string)
- ...
