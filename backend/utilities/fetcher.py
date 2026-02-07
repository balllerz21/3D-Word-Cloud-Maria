"""
The HTML Parser - made with httpx
"""
import httpx
def html_fetcher(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res= httpx.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        return res.text
    except Exception as e:
        print(f"Error fetching URL: {e}")
        return ""
    
# simple testing 
# if __name__ == "__main__":
#     test_url = "https://www.example.com"
#     html = fetch_html(test_url)
#     print(html[:500])