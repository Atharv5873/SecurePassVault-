from operations import add_credential, view_credentials, show_password, delete_credential

def menu():
    while True:
        print(r'''

   _____ ______________  ______  __________  ___   ___________    _____   __  ____  ______   
  / ___// ____/ ____/ / / / __ \/ ____/ __ \/   | / ___/ ___/ |  / /   | / / / / / /_  __/   
  \__ \/ __/ / /   / / / / /_/ / __/ / /_/ / /| | \__ \\__ \| | / / /| |/ / / / /   / /      
 ___/ / /___/ /___/ /_/ / _, _/ /___/ ____/ ___ |___/ /__/ /| |/ / ___ / /_/ / /___/ /       
/____/_____/\____/\____/_/ |_/_____/_/   /_/  |_/____/____/ |___/_/  |_\____/_____/_/        
                                                                                             

''')
        print("1. Add Credential")
        print("2. View Credentials")
        print("3. Reveal Password")
        print("4. Delete Credential")
        print("5. Exit")

        choice = input("Choose an option: ")

        if choice == "1":
            site = input("Site: ")
            username = input("Username: ")
            password = input("Password: ")
            add_credential(site, username, password)

        elif choice == "2":
            view_credentials()

        elif choice == "3":
            cred_id = input("Enter Credential ID to decrypt: ")
            show_password(cred_id)

        elif choice == "4":
            cred_id = input("Enter Credential ID to delete: ")
            delete_credential(cred_id)

        elif choice == "5":
            print("Exiting SecurePassVault...")
            break

        else:
            print("Invalid choice. Try again.")

if __name__ == "__main__":
    menu()
