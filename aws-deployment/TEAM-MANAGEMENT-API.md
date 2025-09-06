# Team Management API Documentation

**CMA Backend - Team Management System**  
**Base URL:** `https://gbcma.us-east-2.elasticbeanstalk.com`  
**Local Development:** `http://localhost:3002`  
**Last Updated:** September 5, 2025

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Team CRUD Operations](#team-crud-operations)
3. [Team Member Management](#team-member-management)
4. [Featured Listings](#featured-listings)
5. [Existing APIs](#existing-apis)
6. [Error Handling](#error-handling)
7. [Data Models](#data-models)
8. [Testing Examples](#testing-examples)

---

## 🏗️ **Overview**

The Team Management API provides a complete backend system for managing real estate teams and their featured listings. Each team can have multiple agents, and the system prioritizes team member properties in featured listings.

### **Key Features:**

- ✅ Complete team CRUD operations
- ✅ Team member management with MLS ID tracking
- ✅ Featured listings with team priority system
- ✅ Duplicate member prevention
- ✅ Integration with existing property search APIs
- ✅ JSON responses for easy frontend consumption

---

## 🏢 **Team CRUD Operations**

### **1. Create New Team**

Creates a new team with name and description.

**Endpoint:** `POST /api/teams`

**Request Body:**

```json
{
  "name": "Downtown Team",
  "description": "Downtown specialists"
}
```

**Response:**

```json
{
  "success": true,
  "team": {
    "id": 1,
    "name": "Downtown Team",
    "description": "Downtown specialists",
    "members": [],
    "created_at": "2025-09-06T03:37:38.354Z"
  },
  "message": "Team created successfully"
}
```

**cURL Example:**

```bash
curl -X POST https://gbcma.us-east-2.elasticbeanstalk.com/api/teams \
  -H "Content-Type: application/json" \
  -d '{"name":"Downtown Team","description":"Downtown specialists"}'
```

---

### **2. Get All Teams**

Retrieves all teams with member counts.

**Endpoint:** `GET /api/teams`

**Response:**

```json
{
  "success": true,
  "count": 2,
  "teams": [
    {
      "id": 1,
      "name": "Downtown Team",
      "description": "Downtown specialists",
      "memberCount": 2,
      "created_at": "2025-09-06T03:37:38.354Z",
      "members": [
        {
          "id": 1,
          "agent_name": "John Doe",
          "agent_mls_id": "JD123",
          "agent_phone": "555-1234",
          "added_at": "2025-09-06T03:37:54.727Z"
        }
      ]
    }
  ]
}
```

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams"
```

---

### **3. Get Specific Team**

Retrieves detailed information for a specific team.

**Endpoint:** `GET /api/teams/:teamId`

**Response:**

```json
{
  "success": true,
  "team": {
    "id": 1,
    "name": "Downtown Team",
    "description": "Downtown specialists",
    "members": [
      {
        "id": 1,
        "agent_name": "John Doe",
        "agent_mls_id": "JD123",
        "agent_phone": "555-1234",
        "added_at": "2025-09-06T03:37:54.727Z"
      }
    ],
    "created_at": "2025-09-06T03:37:38.354Z"
  }
}
```

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1"
```

---

### **4. Update Team**

Updates team name and/or description.

**Endpoint:** `PUT /api/teams/:teamId`

**Request Body:**

```json
{
  "name": "Updated Downtown Team",
  "description": "Premium downtown specialists"
}
```

**Response:**

```json
{
  "success": true,
  "team": {
    "id": 1,
    "name": "Updated Downtown Team",
    "description": "Premium downtown specialists",
    "members": [...],
    "created_at": "2025-09-06T03:37:38.354Z",
    "updated_at": "2025-09-06T03:38:22.624Z"
  },
  "message": "Team updated successfully"
}
```

**cURL Example:**

```bash
curl -X PUT https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Team Name","description":"Updated description"}'
```

---

### **5. Delete Team**

Permanently deletes a team and all its members.

**Endpoint:** `DELETE /api/teams/:teamId`

**Response:**

```json
{
  "success": true,
  "message": "Team deleted successfully",
  "deletedTeam": {
    "id": 1,
    "name": "Downtown Team"
  }
}
```

**cURL Example:**

```bash
curl -X DELETE "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1"
```

---

## 👥 **Team Member Management**

### **6. Get Team Members**

Retrieves all members of a specific team.

**Endpoint:** `GET /api/teams/:teamId/members`

**Response:**

```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Downtown Team",
  "count": 2,
  "members": [
    {
      "id": 1,
      "agent_name": "John Doe",
      "agent_mls_id": "JD123",
      "agent_phone": "555-1234",
      "added_at": "2025-09-06T03:37:54.727Z"
    },
    {
      "id": 2,
      "agent_name": "Jane Smith",
      "agent_mls_id": "JS456",
      "agent_phone": "555-5678",
      "added_at": "2025-09-06T03:37:59.648Z"
    }
  ]
}
```

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members"
```

---

### **7. Add Member to Team**

Adds a new agent to a team. Prevents duplicate MLS IDs.

**Endpoint:** `POST /api/teams/:teamId/members`

**Request Body:**

```json
{
  "agent_name": "John Doe",
  "agent_mls_id": "JD123",
  "agent_phone": "555-1234"
}
```

**Response:**

```json
{
  "success": true,
  "member": {
    "id": 1,
    "agent_name": "John Doe",
    "agent_mls_id": "JD123",
    "agent_phone": "555-1234",
    "added_at": "2025-09-06T03:37:54.727Z"
  },
  "team": {
    "id": 1,
    "name": "Downtown Team",
    "memberCount": 1
  },
  "message": "Member added to team successfully"
}
```

**cURL Example:**

```bash
curl -X POST https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"John Doe","agent_mls_id":"JD123","agent_phone":"555-1234"}'
```

**Duplicate Prevention:**
If agent already exists in team:

```json
{
  "success": false,
  "error": "Agent already in team",
  "existingMember": {
    "id": 1,
    "agent_name": "John Doe",
    "agent_mls_id": "JD123",
    "agent_phone": "555-1234",
    "added_at": "2025-09-06T03:37:54.727Z"
  }
}
```

---

### **8. Remove Member from Team**

Removes a specific member from a team.

**Endpoint:** `DELETE /api/teams/:teamId/members/:memberId`

**Response:**

```json
{
  "success": true,
  "message": "Member removed from team successfully",
  "removedMember": {
    "id": 2,
    "agent_name": "Jane Smith",
    "agent_mls_id": "JS456",
    "agent_phone": "555-5678",
    "added_at": "2025-09-06T03:37:59.648Z"
  },
  "team": {
    "id": 1,
    "name": "Downtown Team",
    "memberCount": 1
  }
}
```

**cURL Example:**

```bash
curl -X DELETE "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members/2"
```

---

## ⭐ **Featured Listings**

### **9. Get Featured Listings for Team**

Retrieves properties with team member listings prioritized first, then other properties.

**Endpoint:** `GET /api/teams/:teamId/featured-listings`

**Query Parameters:**

- `city` (optional) - Filter by city name
- `status` (optional) - "Active" (default) or "Sold"
- `limit` (optional) - Number of results (default: 50)
- `include_others` (optional) - "true" to include non-team properties

**Response:**

```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Downtown Team",
  "teamMembers": 2,
  "count": 5,
  "teamPropertiesCount": 3,
  "otherPropertiesCount": 2,
  "teamProperties": [
    {
      "id": "12345",
      "mlsNumber": "BK12345",
      "address": "123 Downtown Ave",
      "city": "Brooklyn",
      "state": "NY",
      "zipCode": "11201",
      "listPrice": 850000,
      "soldPrice": 0,
      "sqft": 1200,
      "totalSqft": 1200,
      "beds": 2,
      "baths": 2,
      "garage": 1,
      "yearBuilt": 2015,
      "status": "Active",
      "closeDate": null,
      "onMarketDate": "2025-08-01T00:00:00Z",
      "pricePerSqft": 708,
      "propertyType": "Residential",
      "condition": "Excellent",
      "style": "Modern",
      "subdivision": "Downtown Heights",
      "latitude": 40.6892,
      "longitude": -73.9842,
      "description": "Beautiful modern condo in the heart of downtown...",
      "imageUrl": "https://example.com/image1.jpg",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "listAgent": {
        "name": "John Doe",
        "mlsId": "JD123",
        "phone": "555-1234"
      },
      "isFeatured": true,
      "isTeamProperty": true
    }
  ],
  "otherProperties": [],
  "searchCriteria": {
    "city": "brooklyn",
    "status": "Active",
    "limit": 20,
    "include_others": "true"
  },
  "meta": {
    "teamAgentIds": "JD123,JS456",
    "priorityOrder": "Team properties first, then others"
  }
}
```

**cURL Examples:**

```bash
# Basic featured listings
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/featured-listings"

# With filters
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/featured-listings?city=brooklyn&status=Active&limit=20"

# Sold properties in last 12 months
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/featured-listings?status=Sold&limit=10"
```

---

## 🔍 **Existing APIs**

### **10. Agent Suggestions (Autocomplete)**

Get agent name suggestions for autocomplete functionality.

**Endpoint:** `GET /api/agents/suggestions`

**Query Parameters:**

- `q` (required) - Search query
- `limit` (optional) - Number of results (default: 10)

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/agents/suggestions?q=bjork&limit=10"
```

---

### **11. Team Properties (Multiple Agents)**

Get properties for multiple agent IDs.

**Endpoint:** `GET /api/team-properties`

**Query Parameters:**

- `agent_ids` (required) - Comma-separated MLS IDs
- `city` (optional) - Filter by city
- `status` (optional) - "Active" or "Sold"

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/team-properties?agent_ids=JD123,JS456&city=brooklyn&status=Active"
```

---

### **12. Regular Property Search**

Standard property search functionality.

**Endpoint:** `GET /api/property-search`

**cURL Example:**

```bash
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/property-search?city=brooklyn&status=Active&limit=10"
```

---

## 🚨 **Error Handling**

### **Common Error Responses:**

**Team Not Found (404):**

```json
{
  "success": false,
  "error": "Team not found"
}
```

**Missing Required Fields (400):**

```json
{
  "success": false,
  "error": "Team name is required"
}
```

**Member Not Found (404):**

```json
{
  "success": false,
  "error": "Member not found in team"
}
```

**Server Error (500):**

```json
{
  "success": false,
  "error": "Internal server error message"
}
```

---

## 📊 **Data Models**

### **Team Model:**

```json
{
  "id": 1,
  "name": "Team Name",
  "description": "Team description",
  "members": [MemberModel],
  "created_at": "2025-09-06T03:37:38.354Z",
  "updated_at": "2025-09-06T03:38:22.624Z"
}
```

### **Member Model:**

```json
{
  "id": 1,
  "agent_name": "John Doe",
  "agent_mls_id": "JD123",
  "agent_phone": "555-1234",
  "added_at": "2025-09-06T03:37:54.727Z"
}
```

### **Property Model:**

```json
{
  "id": "ListingKey",
  "mlsNumber": "ListingId",
  "address": "Full Address",
  "city": "City",
  "state": "State",
  "zipCode": "Postal Code",
  "listPrice": 850000,
  "soldPrice": 800000,
  "sqft": 1200,
  "totalSqft": 1200,
  "beds": 2,
  "baths": 2,
  "garage": 1,
  "yearBuilt": 2015,
  "status": "Active|Closed",
  "closeDate": "2025-09-01T00:00:00Z",
  "onMarketDate": "2025-08-01T00:00:00Z",
  "pricePerSqft": 708,
  "propertyType": "Residential",
  "condition": "Excellent",
  "style": "Modern",
  "subdivision": "Neighborhood",
  "latitude": 40.6892,
  "longitude": -73.9842,
  "description": "Property description...",
  "imageUrl": "Primary image URL",
  "images": ["Array of image URLs"],
  "listAgent": {
    "name": "Agent Name",
    "mlsId": "Agent MLS ID",
    "phone": "Agent Phone"
  },
  "isFeatured": true,
  "isTeamProperty": true
}
```

---

## 🧪 **Testing Examples**

### **Complete Team Management Workflow:**

```bash
# 1. Create team
curl -X POST https://gbcma.us-east-2.elasticbeanstalk.com/api/teams \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Team","description":"Testing team"}'

# 2. Add members
curl -X POST https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"Agent One","agent_mls_id":"A001","agent_phone":"555-0001"}'

curl -X POST https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"Agent Two","agent_mls_id":"A002","agent_phone":"555-0002"}'

# 3. Get team with members
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1"

# 4. Get featured listings
curl "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/featured-listings?city=brooklyn&limit=10"

# 5. Update team
curl -X PUT https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test Team","description":"Updated description"}'

# 6. Remove member
curl -X DELETE "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1/members/2"

# 7. Delete team
curl -X DELETE "https://gbcma.us-east-2.elasticbeanstalk.com/api/teams/1"
```

---

## 🚀 **Deployment Information**

- **Production URL:** `https://gbcma.us-east-2.elasticbeanstalk.com`
- **Local Development:** `http://localhost:3002`
- **AWS Deployment:** Elastic Beanstalk
- **Data Storage:** In-memory (production should use database)
- **Last Deployed:** September 5, 2025

### **Deployment Package:**

- `gbcma-team-management-backend-2025-09-05.zip`
- Contains all team management APIs
- Ready for AWS Elastic Beanstalk deployment

---

## 💡 **Integration Notes**

### **For Frontend Applications:**

1. All endpoints return consistent JSON responses with `success` boolean
2. Use `teamId` and `memberId` for all operations
3. Team properties are automatically prioritized in featured listings
4. Error responses include descriptive messages for user feedback
5. Agent MLS IDs are used for property matching

### **Priority System:**

1. **Team Properties First** - Properties where list agent is a team member
2. **Other Properties** - All other matching properties (when `include_others=true`)

### **Data Persistence:**

- Current implementation uses in-memory storage
- For production, integrate with database (PostgreSQL, MongoDB, etc.)
- Team and member data will reset on server restart

---

_This API documentation is maintained for the CMA Backend Team Management System. For questions or updates, contact the development team._
