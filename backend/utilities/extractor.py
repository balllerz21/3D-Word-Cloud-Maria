from bs4 import BeautifulSoup

def get_text(html):
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    article = soup.find("article")
    if article:
        text = article.get_text(" ")
    else:
        text = soup.get_text(" ")
    text = " ".join(text.split())
    return text

# simple testing
# if __name__ == "__main__":
#     from fetcher import html_fetcher
#     test_url = "https://www.example.com"
#     html = html_fetcher(test_url)
#     text = get_data(html)
#     print("TEXT chars:", len(text))
#     print(text[:300])