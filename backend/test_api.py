#!/usr/bin/env python3
"""
Quick test script for SportSurge Python Backend
Tests all major API endpoints.
"""
import httpx
import asyncio
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"


async def test_endpoint(name: str, method: str, path: str, **kwargs):
    """Test a single API endpoint."""
    url = f"{BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if method == "GET":
                response = await client.get(url, **kwargs)
            elif method == "POST":
                response = await client.post(url, **kwargs)
            else:
                response = await client.request(method, url, **kwargs)

            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {name}: {response.status_code}")
                return data
            else:
                print(f"  ❌ {name}: {response.status_code} - {response.text[:100]}")
                return None
    except Exception as e:
        print(f"  ❌ {name}: {str(e)[:80]}")
        return None


async def run_tests():
    """Run all API tests."""
    print("🧪 SportSurge Backend API Tests")
    print("=" * 50)

    # Health
    print("\n📋 Health Check:")
    data = await test_endpoint("Health", "GET", "/health")
    if data:
        print(f"     Provider: {data.get('ai_provider')}")
        print(f"     YouTube: {data.get('youtube_available')}")

    # Sports
    print("\n🏈 Sports:")
    data = await test_endpoint("List Sports", "GET", "/sports")
    if data:
        for s in data.get("sports", []):
            print(f"     {s['slug']}: {s['name']}")

    # Matches
    print("\n⚽ Matches:")
    data = await test_endpoint("All Matches", "GET", "/matches")
    if data:
        print(f"     Total: {data.get('total')}")

    data = await test_endpoint("Live Matches", "GET", "/live")
    if data:
        print(f"     Live: {data.get('total')}")

    data = await test_endpoint("Upcoming", "GET", "/upcoming")
    if data:
        print(f"     Upcoming: {data.get('total')}")

    data = await test_endpoint("Finished", "GET", "/finished")
    if data:
        print(f"     Finished: {data.get('total')}")

    # Authors
    print("\n✍️  Authors:")
    data = await test_endpoint("List Authors", "GET", "/authors")
    if data:
        for a in data.get("authors", []):
            print(f"     {a['slug']}: {a['name']} ({a['specialty']})")

    # Standings
    print("\n📊 Standings:")
    data = await test_endpoint("NBA Standings", "GET", "/standings/nba")
    if data:
        for s in data.get("standings", [])[:3]:
            team = s.get("team", {})
            print(f"     #{s['position']} {team.get('name', 'N/A')}: {s['wins']}W-{s['losses']}L")

    # Fetch data from ESPN
    print("\n📡 ESPN Data Fetch:")
    data = await test_endpoint("Fetch NBA Data", "POST", "/fetch-data?sport=nba")
    if data:
        print(f"     Result: {json.dumps(data.get('results', {}), indent=2)[:200]}")

    print("\n" + "=" * 50)
    print("✅ All tests completed!")


if __name__ == "__main__":
    asyncio.run(run_tests())
