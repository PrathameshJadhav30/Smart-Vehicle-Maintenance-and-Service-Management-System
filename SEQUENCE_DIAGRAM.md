# SVMMS Sequence Diagrams

## Overview
This document shows the interactions between different system components for key business processes in the SVMMS system using clear sequence diagrams.

## 1. Customer Service Booking Sequence

```
Customer      System        Booking Service    Database
   │             │                │              │
   │──Book Service──►            │              │
   │             │                │              │
   │             │──Validate Data──►             │
   │             │                │              │
   │             │◄──Validation OK──│             │
   │             │                │              │
   │             │──Create Booking──►             │
   │             │                │              │
   │             │                │──Save Booking──►
   │             │                │              │
   │             │                │◄──Booking Saved──│
   │             │◄──Booking Created──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
```

## 2. Admin Booking Approval Sequence

```
Admin         System        Booking Service    Database
   │             │                │              │
   │──View Pending──►            │              │
   │             │                │              │
   │             │──Get Pending───►              │
   │             │                │──Get Pending──►
   │             │                │              │
   │             │◄──Bookings List──│             │
   │◄──Display List──│                │              │
   │             │                │              │
   │──Approve & Assign──►         │              │
   │             │                │              │
   │             │──Update Status──►              │
   │             │                │──Update Booking──►
   │             │                │              │
   │             │                │◄──Booking Updated──│
   │             │◄──Approval Done──│             │
   │◄──Success Message──│                │              │
   │             │                │              │
```

## 3. Mechanic Job Card Processing Sequence

```
Mechanic      System        Job Card Service   Database
   │             │                │              │
   │──View Jobs──►               │              │
   │             │                │              │
   │             │──Get Assigned───►             │
   │             │                │──Get Jobs───►
   │             │                │              │
   │             │◄──Job List─────│             │
   │◄──Display Jobs──│                │              │
   │             │                │              │
   │──Start Job──►               │              │
   │             │                │              │
   │             │──Update Status──►              │
   │             │                │──Update Job──►
   │             │                │              │
   │             │                │◄──Job Updated──│
   │             │◄──Status Updated──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
   │──Add Parts──►               │              │
   │             │                │              │
   │             │──Update Parts───►              │
   │             │                │──Update Inventory──►
   │             │                │              │
   │             │                │◄──Inventory Updated──│
   │             │◄──Parts Added──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
   │──Complete Job──►             │              │
   │             │                │              │
   │             │──Finalize Job───►              │
   │             │                │──Update Job──►
   │             │                │              │
   │             │                │◄──Job Updated──│
   │             │◄──Job Completed──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
```

## 4. Invoice Generation Sequence

```
System        Job Card Service   Invoice Service    Database
   │             │                │                │
   │──Job Completed──►            │                │
   │             │                │                │
   │             │──Calculate Costs──►              │
   │             │                │                │
   │             │──Create Invoice──►               │
   │             │                │──Save Invoice──►
   │             │                │                │
   │             │                │◄──Invoice Saved──│
   │             │◄──Invoice Created──│             │
   │◄──Invoice Generated──│                │         │
   │             │                │                │
   │──Notify Customer──►           │                │
   │             │                │                │
   │             │──Send Notification──►            │
   │             │                │                │
   │             │◄──Notification Sent──│           │
   │◄──Notification Sent──│                │         │
   │             │                │                │
```

## 5. Customer Payment Processing Sequence

```
Customer      System        Payment Service    Database
   │             │                │              │
   │──View Invoice──►            │              │
   │             │                │              │
   │             │──Get Invoice───►              │
   │             │                │──Get Invoice──►
   │             │                │              │
   │             │◄──Invoice Data──│             │
   │◄──Display Invoice──│                │         │
   │             │                │              │
   │──Make Payment──►             │              │
   │             │                │              │
   │             │──Process Payment──►            │
   │             │                │              │
   │             │──Connect Gateway──►            │
   │             │                │              │
   │             │◄──Payment Processed──│         │
   │             │──Update Status──►              │
   │             │                │──Update Payment──►
   │             │                │              │
   │             │                │◄──Payment Updated──│
   │             │◄──Payment Success──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
```

## 6. Parts Inventory Management Sequence

```
Admin         System        Parts Service      Database
   │             │                │              │
   │──View Parts──►              │              │
   │             │                │              │
   │             │──Get Parts List──►            │
   │             │                │──Get Parts──►
   │             │                │              │
   │             │◄──Parts List───│             │
   │◄──Display Parts──│                │         │
   │             │                │              │
   │──Add New Part──►             │              │
   │             │                │              │
   │             │──Validate Data──►              │
   │             │                │              │
   │             │◄──Validation OK──│             │
   │             │──Save Part─────►              │
   │             │                │──Save Part──►
   │             │                │              │
   │             │                │◄──Part Saved──│
   │             │◄──Part Added───│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
   │──Update Stock──►             │              │
   │             │                │              │
   │             │──Update Quantity──►            │
   │             │                │──Update Stock──►
   │             │                │              │
   │             │                │◄──Stock Updated──│
   │             │◄──Update Success──│             │
   │◄──Confirmation──│                │              │
   │             │                │              │
```

## 7. User Authentication Sequence

```
User          System        Auth Service       Database
   │             │                │              │
   │──Login─────►               │              │
   │             │                │              │
   │             │──Validate Credentials──►      │
   │             │                │──Verify User──►
   │             │                │              │
   │             │◄──User Verified──│             │
   │             │──Generate Token──►             │
   │             │                │              │
   │             │◄──Token Generated──│           │
   │◄──Login Success──│                │         │
   │             │                │              │
   │──Access Protected──►         │              │
   │             │                │              │
   │             │──Verify Token───►              │
   │             │                │              │
   │             │◄──Token Valid──│             │
   │◄──Access Granted──│                │         │
   │             │                │              │
```

## 8. Admin Dashboard Analytics Sequence

```
Admin         System        Analytics Service  Database
   │             │                │              │
   │──View Reports──►            │              │
   │             │                │              │
   │             │──Get Metrics───►              │
   │             │                │──Query Data──►
   │             │                │              │
   │             │◄──Metrics Data──│             │
   │◄──Display Charts──│                │         │
   │             │                │              │
   │──Filter Data──►              │              │
   │             │                │              │
   │             │──Apply Filters──►              │
   │             │                │──Query Filtered──►
   │             │                │              │
   │             │◄──Filtered Data──│             │
   │◄──Display Results──│                │         │
   │             │                │              │
```

## Key Interactions Summary

### Primary Actors and Their Interactions:
- **Customer**: Books services, views invoices, makes payments, manages profile
- **Mechanic**: Views jobs, updates status, adds costs, completes jobs
- **Admin**: Approves bookings, manages users/parts, generates reports

### System Components:
- **System**: Orchestrates all interactions
- **Service Layer**: Handles business logic
- **Database**: Stores and retrieves data
- **External Services**: Payment gateways, notification services

These sequence diagrams provide a clear, non-complex view of how different actors interact with the system components for various business processes in the SVMMS system.