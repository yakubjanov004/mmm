import urllib.request
import urllib.parse
import json
import ssl

# Ignore SSL certificate errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "http://localhost:8000/api"

def debug_api():
    try:
        # 1. Login
        login_url = f"{BASE_URL}/auth/login/"
        print(f"Logging in to {login_url}...")
        data = json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8')
        req = urllib.request.Request(login_url, data=data, headers={'Content-Type': 'application/json'})
        
        access_token = ""
        with urllib.request.urlopen(req, context=ctx) as response:
            print(f"Login Status: {response.getcode()}")
            resp_body = response.read().decode('utf-8')
            tokens = json.loads(resp_body)
            access_token = tokens["access"]
            print("Login successful, got token.")

        headers = {'Authorization': f'Bearer {access_token}'}

        # 2. Get Certificates
        print("\nFetching certificates...")
        try:
            req = urllib.request.Request(f"{BASE_URL}/certificates/", headers=headers)
            with urllib.request.urlopen(req, context=ctx) as response:
                data = json.loads(response.read().decode())
                print(f"Response type: {type(data)}")
                if isinstance(data, dict) and 'results' in data:
                    print(f"Results count: {len(data['results'])}")
                    certs_with_authors = 0
                    for cert in data['results']:
                        if cert.get('authors'):
                            certs_with_authors += 1
                    print(f"Certificates with authors: {certs_with_authors} / {len(data['results'])}")
                    
                    if len(data['results']) > 0:
                        print("First certificate authors:", json.dumps(data['results'][0].get('authors'), indent=2))
                else:
                    print("Response:", data)
        except urllib.error.URLError as e:
            print(f"Error fetching certificates: {e}")
            if hasattr(e, 'read'):
                print(e.read().decode('utf-8'))

        # 3. Create Certificate (JSON)
        print("\nCreating test certificate...")
        try:
            # Get a user ID first
            user_id = None
            users_url = f"{BASE_URL}/users/"
            req = urllib.request.Request(users_url, headers=headers)
            with urllib.request.urlopen(req, context=ctx) as response:
                users = json.loads(response.read().decode())
                if isinstance(users, dict) and 'results' in users and len(users['results']) > 0:
                    user_id = users['results'][0]['id']
                    print(f"Using user ID: {user_id}")

            if user_id:
                new_cert = {
                    "title": "Debug Certificate",
                    "year": "2024-2025",
                    "type": "LOCAL",
                    "language": "UZ",
                    "authors": [user_id],
                    "description": "Created by debug script"
                }
                create_url = f"{BASE_URL}/certificates/"
                req = urllib.request.Request(create_url, data=json.dumps(new_cert).encode('utf-8'), headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                })
                with urllib.request.urlopen(req, context=ctx) as response:
                    print(f"Create Status: {response.getcode()}")
                    created_cert = json.loads(response.read().decode('utf-8'))
                    print("Created certificate authors:", json.dumps(created_cert.get('authors'), indent=2))
        except urllib.error.HTTPError as e:
            print(f"Error creating certificate: {e.code}")
            print(e.read().decode('utf-8'))
        except Exception as e:
            print(f"Exception creating certificate: {e}")


    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_api()
