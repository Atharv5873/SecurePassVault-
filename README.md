# SecurePassVault

SecurePassVault is a simple command-line password manager to securely store, view, reveal, and delete your credentials using encryption with Python and MongoDB.

---

## Features

- Add new credentials (site, username, password) with encrypted password storage
- View all stored credentials with encrypted passwords
- Reveal decrypted password for a specific credential
- Delete credentials by ID
- Simple and intuitive CLI interface

---

## Requirements

- Python 3.7+
- MongoDB (local or cloud instance)
- Python packages listed in `requirements.txt`

---

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/SecurePassVault.git
   cd SecurePassVault

2. Install dependencies:
    ```bash
    pip install -r requirements.txt

3. Make sure MongoDB is running and accessible.

## Usage

- Run the main application:
    ```bash
    python main.py

---

## Project Structure
    SecurePassVault/
        ├── main.py
        ├── operations.py
        ├── encryptor.py
        ├── db_config.py
        ├── key.key        # Automatically generated encryption key
        ├── requirements.txt
        ├── LICENSE
        └── README.md

## How it Works
- Passwords are encrypted using the cryptography package's Fernet symmetric encryption.
- Encryption key is saved in key.key.
- Credentials are stored in a MongoDB collection.
- Credential IDs are MongoDB ObjectIds.

## Author

**Atharv Sharma**  
📧 Email: [atharv5873@gmail.com](mailto:atharv5873@gmail.com)  
🐙 GitHub: [atharv5873](https://github.com/atharv5873)  
🔗 LinkedIn: [Atharv Sharma](https://www.linkedin.com/in/atharv-sharma-a3b6a0251/)

