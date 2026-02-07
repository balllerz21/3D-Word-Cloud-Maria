from sklearn.feature_extraction.text import TfidfVectorizer
def get_keywords(text, top_k):
    if not text:
        return []

    vectorizer = TfidfVectorizer(stop_words="english")
    X = vectorizer.fit_transform([text])

    terms = vectorizer.get_feature_names_out()
    scores = X.toarray()[0]

    pairs = sorted(zip(terms, scores), key=lambda x: x[1], reverse=True)
    pairs = pairs[:top_k]

    if not pairs:
        return []

    max_score = pairs[0][1]
    res = []
    
    for w, s in pairs:
        res.append({"word": w, "weight": float(s / max_score)})
    return res

# simple testing
# if __name__ == "__main__":
#     from fetcher import html_fetcher
#     from extractor import get_data

#     url = "https://example.com"  
#     html = html_fetcher(url)
#     print("HTML chars:", len(html))

#     text = get_data(html)
#     print("TEXT chars:", len(text))
#     print("TEXT preview:", text[:200])

#     words = analyzer(text, top_k=20)
#     print("\nTop keywords:")
#     for w in words[:10]:
#         print(w)