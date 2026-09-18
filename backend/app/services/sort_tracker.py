import numpy as np
from scipy.optimize import linear_sum_assignment
from datetime import datetime, timezone
from typing import Any

from app.services.detector import Detection, BoundingBox
from app.services.tracker import Tracker, Track

def iou_batch(bb_test, bb_gt):
    """
    Computes IOU between two bboxes in the form [x1,y1,x2,y2]
    """
    bb_gt = np.expand_dims(bb_gt, 0)
    bb_test = np.expand_dims(bb_test, 1)

    xx1 = np.maximum(bb_test[..., 0], bb_gt[..., 0])
    yy1 = np.maximum(bb_test[..., 1], bb_gt[..., 1])
    xx2 = np.minimum(bb_test[..., 2], bb_gt[..., 2])
    yy2 = np.minimum(bb_test[..., 3], bb_gt[..., 3])

    w = np.maximum(0., xx2 - xx1)
    h = np.maximum(0., yy2 - yy1)
    wh = w * h

    o = wh / ((bb_test[..., 2] - bb_test[..., 0]) * (bb_test[..., 3] - bb_test[..., 1]) +
              (bb_gt[..., 2] - bb_gt[..., 0]) * (bb_gt[..., 3] - bb_gt[..., 1]) - wh)
    return o

class SortTracker(Tracker):
    """
    Simple IoU-based deterministic tracker for the hackathon MVP.
    Provides tracking IDs for bounding boxes.
    """
    def __init__(self, iou_threshold=0.3, max_age=5):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.tracks_dict: dict[int, Track] = {}
        self.unmatched_ages: dict[int, int] = {}
        self._next_id = 1

    def update(self, detections: list[Detection]) -> list[Track]:
        now = datetime.now(timezone.utc)
        
        if not detections:
            # age all tracks
            for tid in list(self.tracks_dict.keys()):
                self.unmatched_ages[tid] += 1
                if self.unmatched_ages[tid] > self.max_age:
                    del self.tracks_dict[tid]
                    del self.unmatched_ages[tid]
            return list(self.tracks_dict.values())
            
        det_boxes = np.array([[d.bbox.x1, d.bbox.y1, d.bbox.x2, d.bbox.y2] for d in detections])
        
        if not self.tracks_dict:
            # initialize
            for d in detections:
                tid = self._next_id
                self._next_id += 1
                t = Track(
                    track_id=f"TRK-{tid:06d}",
                    class_id=d.class_id,
                    class_name=d.class_name,
                    confidence=d.confidence,
                    bbox=d.bbox,
                    first_seen=now,
                    last_seen=now,
                    age=1,
                    metadata=d.metadata.copy()
                )
                self.tracks_dict[tid] = t
                self.unmatched_ages[tid] = 0
            return list(self.tracks_dict.values())

        track_ids = list(self.tracks_dict.keys())
        trk_boxes = np.array([[self.tracks_dict[tid].bbox.x1, self.tracks_dict[tid].bbox.y1, 
                               self.tracks_dict[tid].bbox.x2, self.tracks_dict[tid].bbox.y2] for tid in track_ids])

        iou_matrix = iou_batch(det_boxes, trk_boxes)
        
        # Hungarian algorithm
        row_ind, col_ind = linear_sum_assignment(-iou_matrix)
        
        unmatched_dets = set(range(len(detections)))
        unmatched_trks = set(range(len(track_ids)))
        
        matches = []
        for r, c in zip(row_ind, col_ind):
            if iou_matrix[r, c] >= self.iou_threshold:
                matches.append((r, c))
                unmatched_dets.discard(r)
                unmatched_trks.discard(c)
                
        # update matches
        for d_idx, t_idx in matches:
            tid = track_ids[t_idx]
            d = detections[d_idx]
            trk = self.tracks_dict[tid]
            
            trk.bbox = d.bbox
            trk.confidence = d.confidence
            trk.last_seen = now
            trk.age += 1
            self.unmatched_ages[tid] = 0
            
        # add new
        for d_idx in unmatched_dets:
            d = detections[d_idx]
            tid = self._next_id
            self._next_id += 1
            t = Track(
                track_id=f"TRK-{tid:06d}",
                class_id=d.class_id,
                class_name=d.class_name,
                confidence=d.confidence,
                bbox=d.bbox,
                first_seen=now,
                last_seen=now,
                age=1,
                metadata=d.metadata.copy()
            )
            self.tracks_dict[tid] = t
            self.unmatched_ages[tid] = 0
            
        # age unmatched
        for t_idx in unmatched_trks:
            tid = track_ids[t_idx]
            self.unmatched_ages[tid] += 1
            if self.unmatched_ages[tid] > self.max_age:
                del self.tracks_dict[tid]
                del self.unmatched_ages[tid]
                
        return list(self.tracks_dict.values())

    def reset(self) -> None:
        self._next_id = 1
        self.tracks_dict.clear()
        self.unmatched_ages.clear()
