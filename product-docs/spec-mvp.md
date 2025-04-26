# MVP Features Spec

## Scope & Purpose

This is a spending tracking web application. The goal is to create a simple and easy-to-use application that allows users to track their spending, set budgets, and analyze their financial habits.
The application should be user-friendly and provide a clear overview of the user's financial situation. The main features include tracking income and expenses, categorizing transactions, and generating reports.

### Non functional requirements
    - Supports internationalization

### Multi-user & Auth
    - The application should support multiple users, each with their own accounts and transactions.
    - Users should be able to sign up and log in using their email address and password.
    - Passwords should be securely hashed and stored.

### Navigation panel at the top which allows to
    - Open Man page
    - Open Records page
    - Open Accounts page
    - Open Categories page
    - Open User Profile page

### Main Page
    - Contains a list of accounts with their balances
    - Contains one ballance for all accounts
    - Add expense 
    - Add income
    - Add transfer between accounts
    - List of 10 most recent transaction. It has load more button that allow to load more transactions
      - User can delete any transaction from the list
      - User can edit any transaction from the list

### User Profile Page
    - User name
    - User email
    - User password. Password should be hashed and stored securely. The password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
    - Save button. Which saves the changes made to the user profile
    - Cancel button. Which discards the changes made to the user profile
    - Delete account button. Which deletes the user account and all associated data. The user should be asked to confirm the deletion before proceeding.
    - Logout button. Which logs the user out of the application
    - Preference settings. The user should be able to set their preferred currency, date format, and language. The application should support multiple currencies and languages.

#### Expense/Income Record
    - Account
    - Selection of account is implemented as dropdown list
    - Category
    - Selection of category is implemented as dropdown list
    - Record Note/Description
    - Text field with maximum 128 unicode characters
    - Transaction Date
    - Dropdown calendar input

#### Transfer Record
    - From Account
    - Selection of account is implemented as dropdown list
    - From Currency
    - To Account
    - Selection of account is implemented as dropdown list
    - To Currency
    - Amount. If From and To currencies are the same then the amount is one field. If they are different then the amount is two fields. One for From currency and one for To currency    
    - Transaction Date
    - Dropdown calendar input
    - Transfer Note/Description maximum 128 unicode characters

### Accounts Page	   
    - List of accounts grouped by account category
    - Add account button at the top of the page
    - Manage currencies button which opens Currencies page
    - Ability to edit any account

#### Account record page
    - Account name
    - Account category
    - List of available currencies for the current user. That list is the list of checkboxes
    - Save button
    - Cancel button
    
### Records Page
    - Contains a list of transactions
    - The top of the page is occupied by different filters
    - Period of transactions filter. Consist of date begin and date end
    - Type of transactions. All/Expense/Income/Transfer
    - Transaction note. A text field that is used to find transactions that contains text in their note/description		
    - Accounts. Dropdown list with all accounts
    - Apply button. Which applies filters
    - The default state of the filters is when the period filter reflects the current month period. All other filters are empty

### Categories page
    - Two panels
    - Left panel contains two tabs
        - The first tab has name Expenses. 
        - It list categories related to expenses
        - It contains a list of predefined categories:
            - Food
            - Transport
            - Entertainment
            - Health
            - Education
            - Other
        - The second tab has name Income
        - It list categories related to incomes
        - It contains a list of predefined categories:            
            - Salary
            - Bonus
            - Gift
            - Investment
            - Other
    - Right panel contains
        - Category name. Max length 50 unicode chars 
        - Show Category
        - Save button. Which creates category and clears the name field
