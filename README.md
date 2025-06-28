# SecurePass Vault v2.0.1 🔐

A modern, secure password management system with a beautiful web interface, built with Next.js frontend and FastAPI backend. SecurePass Vault provides enterprise-grade security with client-side encryption, JWT authentication, and a sleek neon-themed UI.

![Version](https://img.shields.io/badge/Version-2.0.1-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.7+-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15.3+-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green)

## 🌐 Live Demo

**Experience SecurePass Vault in action:** [https://securepassvault-bdtd.onrender.com/](https://securepassvault-bdtd.onrender.com/)

*Try out the modern password management interface with zero-knowledge architecture and two-layer encryption.*

## 📜 Version History
### Version 1.0 (Legacy)
- **Type**: Command-line interface (CLI) application
- **Features**: Basic password storage, encryption, and management
- **Tech Stack**: Python, MongoDB, Cryptography library
- **Interface**: Terminal-based with simple text commands
- **Architecture**: Single Python application with direct database access

### Version 2.0.1 (Current)
- **Type**: Modern web application with responsive UI
- **Features**: Advanced security, user authentication, admin panel, real-time features
- **Tech Stack**: Next.js frontend + FastAPI backend, TypeScript, modern encryption
- **Interface**: Beautiful neon-themed web interface with animations
- **Architecture**: Full-stack application with client-side encryption and JWT authentication

*This version represents a complete rewrite and modernization of the original SecurePassVault, transforming it from a simple CLI tool into a professional-grade web application.*

## 🌟 Features

### 🔐 Security Features
- **Client-Side Encryption**: All passwords are encrypted on the client side before transmission
- **Salt-Based Key Derivation**: Unique salt per user for enhanced security
- **JWT Authentication**: Secure token-based authentication system
- **Password Hashing**: Bcrypt hashing for user passwords
- **MongoDB Integration**: Secure credential storage with MongoDB

### 💻 User Features
- **Modern Web Interface**: Beautiful neon-themed UI with responsive design
- **Password Management**: Add, view, reveal, and delete credentials
- **User Registration & Login**: Secure account creation and authentication
- **Real-time User Count**: Dynamic display of registered users
- **Admin Panel**: User management for administrators
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🛡️ Admin Features
- **User Management**: View all registered users
- **User Deletion**: Remove users from the system
- **User Renaming**: Update user email addresses
- **Admin Access Control**: Restricted admin-only functionality

## 🏗️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Python 3.7+**: Core programming language
- **MongoDB**: NoSQL database for credential storage
- **PyMongo**: MongoDB driver for Python
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing and verification
- **Cryptography**: Encryption and decryption utilities
- **Uvicorn**: ASGI server for FastAPI

### Frontend
- **Next.js 15.3+**: React framework with App Router
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Hot Toast**: Toast notifications
- **CryptoJS**: Client-side encryption
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📁 Project Structure

```
SecurePassVault/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Homepage with login/register
│   │   ├── vault/           # Password vault interface
│   │   ├── admin/           # Admin panel
│   │   ├── aboutus/         # About us page
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utility libraries
│   │   └── crypto/          # Encryption utilities
│   └── public/              # Static assets
├── Routers/                 # FastAPI route handlers
│   ├── auth_router.py       # Authentication endpoints
│   ├── credentials_router.py # Password management
│   └── admin_router.py      # Admin functionality
├── main.py                  # FastAPI application entry
├── auth.py                  # Authentication utilities
├── models.py                # Pydantic models
├── operations.py            # Database operations
├── encryptor.py             # Encryption utilities
├── db_config.py             # Database configuration
└── requirements.txt         # Python dependencies
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- Node.js 18 or higher
- MongoDB (local or cloud instance)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Atharv5873/SecurePassVault-.git
   cd SecurePassVault
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure MongoDB**
   - Set up a MongoDB instance (local or cloud)
   - Update database connection in `db_config.py`

4. **Run the backend server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
SECRET=your_secret
```

### API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/token` - User login
- `GET /auth/salt` - Get user salt
- `GET /auth/me` - Get current user info

#### Credentials
- `POST /credentials/` - Add new credential
- `GET /credentials/` - View all credentials
- `GET /credentials/reveal/{id}` - Reveal password
- `DELETE /credentials/delete/{id}` - Delete credential

#### Admin
- `GET /admin/users` - List all users
- `DELETE /admin/user/{id}` - Delete user
- `PUT /admin/rename/{id}` - Rename user
- `GET /admin/user-count` - Get total user count

## 🔐 Security Implementation

### Client-Side Encryption
- Passwords are encrypted using CryptoJS before transmission
- Unique salt per user for key derivation
- Encryption key derived from user password and salt

### Server-Side Security
- JWT tokens for session management
- Bcrypt password hashing
- MongoDB injection protection
- CORS configuration for frontend integration

### Data Flow
1. User enters password on frontend
2. Salt is fetched from server
3. Encryption key is derived client-side
4. Credentials are encrypted before API transmission
5. Encrypted data is stored in MongoDB
6. Decryption happens client-side only

## 🎨 UI/UX Features

- **Neon Theme**: Modern cyberpunk aesthetic with glowing effects
- **Split-Screen Layout**: Information and visual panels
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion transitions
- **Toast Notifications**: User feedback system
- **Loading States**: Progressive loading indicators

## 👥 Authors

### **Atharv Sharma** - Backend & API Development
- **Role**: FastAPI, Backend, Python, MongoDB linking, API and UI/UX
- **Contributions**: 
  - FastAPI backend architecture
  - MongoDB integration and operations
  - JWT authentication system
  - Password salting and hashing
  - Admin functionality
  - API endpoint development
- **Contact**: 
  - 📧 Email: [atharv5873@gmail.com](mailto:atharv5873@gmail.com)
  - 🐙 GitHub: [atharv5873](https://github.com/atharv5873)
  - 🔗 LinkedIn: [Atharv Sharma](https://www.linkedin.com/in/atharv-sharma-a3b6a0251/)

### **Vatanesh** - Frontend & Integration
- **Role**: Frontend development and backend-frontend linking
- **Contributions**:
  - Next.js frontend development
  - React components and UI
  - Frontend-backend integration
  - Client-side encryption implementation
  - Salt generation and management
  - User interface design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/Atharv5873/SecurePassVault-/issues) on GitHub.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the authors directly via email

---

**SecurePass Vault v2.0.1** - Secure, Modern, Beautiful Password Management

