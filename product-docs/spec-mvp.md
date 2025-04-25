# MVP

### Auth
    - user Sign-up/Sign-in with email
    - user authentification with email

### Navigation panel at the top which allows to
    - Open Man page
    - Open Records page
    - Open Accounts page
    - Open Categories page

### Main Page
    - Add spending 
    - Add income
    - List of 10 most recent transaction. It has load more button that allow to load more transactions

#### Spending/Income Record
    - Account
    - Selection of account is implemented as dropdown list
    - Category
    - Selection of category is implemented as dropdown list
    - Record Note/Description
    - Text field with maximum 128 unicode characters
    - Transaction Date
    - Dropdown calendar input

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
    - Type of transactions. All/Spending/Income
    - Transaction note. A text field that is used to find transactions that contains text in their note/description		
    - Accounts. Dropdown list with all accounts
    - Apply button. Which applies filters
    - The default state of the filters is when the period filter reflects the current month period. All other filters are empty

### Categories page
    - Two pannels
    - Left pannel contais two tabs
        - The first tab has name Spending. 
        - It list categories related to spending
        - The second tab has name Income
        - It list categories related to Income
    - Right pannel contains
        - Category name. Max length 50 unicode chars 
        - Show Category
        - Save button. Which creates category and clears the name field
