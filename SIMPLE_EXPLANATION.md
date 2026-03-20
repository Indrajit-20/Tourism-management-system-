# Simple Explanation of Today's Changes

This note is made so you can explain the project easily.

## 1) Tour Package

- Admin creates package with dates, bus, guide, hotels, boarding points, and images.
- Package has `tour_status`: Scheduled, Running, Completed.
- Status now auto-updates by date:
  - before start date -> Scheduled
  - between start and end date -> Running
  - after end date -> Completed

## 2) Reviews

- User can submit review for package only if:
  - user has booked that package
  - package status is Completed
- User can update their review later (same review record is updated).

## 3) Bus Drivers

- Bus now supports `driver_ids` (1 or 2 drivers).
- Backend validates minimum 1 and maximum 2 drivers.
- Old `driver_id` is still kept for compatibility.

## 4) Hotels

- Hotel management moved to separate admin page.
- Hotel uses MongoDB `_id` only (manual custom hotel_id removed).

## 5) Package Images

- Admin can upload up to 6 images from local PC.
- Images stored in backend uploads folder.
- Database stores image paths, not image binary.

## 6) Admin UI

- Separate admin menu for Manage Hotels.
- Package management table improved for readability and editing.

## Short answer for professor

- We moved from basic CRUD to realistic workflow:
  - date-driven status automation
  - controlled review permissions
  - multi-driver bus assignment
  - separated hotel management
  - file upload support with DB path storage
