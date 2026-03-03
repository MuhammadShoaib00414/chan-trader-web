# Laravel 12 API Starter Kit

A comprehensive Laravel 12 starter kit with React frontend, Passport API authentication, and modern development tools. This starter kit provides a solid foundation for building modern web applications with Laravel 12, React 19, and TypeScript.

## 🚀 Features

- **Laravel 12** - Latest Laravel framework with modern features
- **React 19** - Latest React with TypeScript support
- **Inertia.js v2** - Modern SPA experience with server-side rendering
- **Laravel Passport** - OAuth2 API authentication
- **Laravel Fortify** - Complete authentication scaffolding
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Pest Testing** - Modern PHP testing framework
- **Development Tools** - Debugbar, IDE Helper, Telescope, Log Viewer, and more

## 📦 Included Packages

### Core Framework
- Laravel 12.32.5
- PHP 8.2.29
- React 19.1.1
- TypeScript 5.7.2
- Tailwind CSS 4.1.12

### Authentication & API
- Laravel Passport 13.2.1 (OAuth2 API authentication)
- Laravel Fortify 1.31.1 (Authentication scaffolding)
- Inertia.js 2.1.4 (SPA framework)

### Development Tools
- Laravel Debugbar 3.16 (Debug toolbar)
- Laravel IDE Helper 3.6 (IDE autocompletion)
- Laravel Boost 1.3 (Development enhancements)
- Laravel Telescope 5.13 (Application monitoring)
- Log Viewer 3.19 (Log file management)
- Scribe 5.3 (API documentation)

### Testing & Quality
- Pest 3.8.4 (Modern testing framework)
- PHPUnit 11.5.33 (Testing framework)
- Laravel Pint 1.25.1 (Code formatting)
- ESLint 9.33.0 (JavaScript linting)
- Prettier 3.6.2 (Code formatting)

## 🛠️ Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL/PostgreSQL/SQLite

### Clone the Repository

```bash
git clone git@github.com:snmshahzaib/laravel12apistarterkit.git
cd laravel12apistarterkit
```

### Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=your_database_name
# DB_USERNAME=your_username
# DB_PASSWORD=your_password
```

### Database Setup

```bash
# Run migrations
php artisan migrate

# (Optional) Seed the database
php artisan db:seed
```

### Passport Setup

```bash
php artisan passport:keys
#Create a personal access client
php artisan passport:client --password
```

### Frontend Build

```bash
# Development build
npm run dev

# Production build
npm run build
```

### Start Development Server

```bash
# Using Composer (recommended)
composer run dev

# Or manually
php artisan serve
npm run dev
```

## 🔗 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | User registration (requires full_name, email, phone_number, password, password_confirmation, shop_name, city_district, address). Returns only an OTP for verification; new accounts are assigned the **user** role by default. |
| POST | `/api/login` | User login |
| POST | `/api/refresh` | Refresh access token |
| GET | `/api/user` | Get authenticated user |
| POST | `/api/logout` | User logout |

### OTP Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/email/send` | Send email verification OTP |
| POST | `/api/otp/email/verify` | Verify email OTP |
| POST | `/api/otp/password/send` | Send password reset OTP |
| POST | `/api/otp/password/verify` | Verify password reset OTP |

### Password Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/password/change` | Change password |
| POST | `/api/password/reset` | Reset password |

### Social Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/apple` | Apple OAuth login |
| POST | `/api/auth/check-user` | Check user existence |

### OAuth2 Endpoints (Passport)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/oauth/token` | Issue access token |
| POST | `/oauth/token/refresh` | Refresh access token |
| GET | `/oauth/authorize` | Authorization endpoint |
| POST | `/oauth/authorize` | Approve authorization |
| DELETE | `/oauth/authorize` | Deny authorization |

### Development Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/telescope` | Telescope dashboard |
| GET | `/log-viewer` | Log viewer interface |
| GET | `/docs` | API documentation (Scribe) |

## 🧪 Testing

**Note**: Tests are currently disabled in this starter kit. If you need to enable testing, you can run:

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/AuthTest.php

# Run tests with coverage
php artisan test --coverage
```

## 🎨 Frontend Development

The frontend is built with React 19, TypeScript, and Tailwind CSS v4. Key features:

- **Modern React** with hooks and functional components
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Radix UI** components for accessibility
- **Inertia.js** for SPA experience
- **Vite** for fast development and building

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build with SSR
npm run build:ssr

# Run linter
npm run lint

# Format code
npm run format

# Type checking
npm run types
```

## 📁 Project Structure

```
├── app/
│   ├── Enums/           # Application enums
│   ├── Http/
│   │   ├── Controllers/ # API controllers
│   │   ├── Middleware/  # Custom middleware
│   │   ├── Requests/    # Form request validation
│   │   └── Resources/   # API resources
│   ├── Mail/           # Mail classes
│   ├── Models/         # Eloquent models
│   ├── Providers/      # Service providers
│   └── Traits/         # Reusable traits
├── resources/
│   ├── js/
│   │   ├── components/ # React components
│   │   ├── layouts/    # Page layouts
│   │   ├── pages/      # Inertia pages
│   │   └── types/      # TypeScript types
│   └── css/            # Stylesheets
├── routes/
│   ├── api.php         # API routes
│   ├── auth.php        # Authentication routes
│   ├── web.php         # Web routes
│   └── settings.php    # Settings routes
└── tests/              # Test files
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```env
APP_NAME="Your App Name"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

PASSPORT_PERSONAL_ACCESS_CLIENT_ID=
PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET=

MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
```

## 🚀 Deployment

1. Set up your production environment
2. Configure environment variables
3. Run `composer install --optimize-autoloader --no-dev`
4. Run `npm run build`
5. Run `php artisan migrate --force`
6. Run `php artisan passport:keys --force`

## 📚 Documentation

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Laravel Passport Documentation](https://laravel.com/docs/passport)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## 🙏 Acknowledgments

- Laravel team for the amazing framework
- React team for the frontend library
- All the package maintainers for their contributions

---

**Happy Coding! 🎉**
