import requests

urls = [
    "https://google.com",
    "https://github.com",
    "https://microsoft.com",
    "https://amazon.com",
    "https://cloudflare.com",
    "https://digitalocean.com",
    "https://facebook.com",
    "https://twitter.com",
    "https://linkedin.com",
    "https://apple.com"
]

api_url = "http://localhost:5001/api/certificates"

for url in urls:
    response = requests.post(api_url, json={"url": url})
    if response.status_code == 200:
        print(f"Added {url} successfully")
    else:
        print(f"Failed to add {url}: {response.text}")
