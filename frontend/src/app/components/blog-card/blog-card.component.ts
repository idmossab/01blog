import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Blog, Media } from '../../core/models';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.css'
})
export class BlogCardComponent {
  @Input() blog!: Blog;
  @Input() authorName = '';
  @Input() thumbnail: Media | null = null;
  @Input() dateLabel = '';
  @Input() liked = false;
  @Input() likeCount = 0;
  @Input() commentCount = 0;
  @Input() showOwnerActions = false;
  @Input() showEngagementActions = true;

  @Output() open = new EventEmitter<void>();
  @Output() like = new EventEmitter<Event>();
  @Output() comment = new EventEmitter<Event>();
  @Output() edit = new EventEmitter<Event>();
  @Output() delete = new EventEmitter<Event>();

  hasRenderableThumbnail(): boolean {
    if (!this.thumbnail) return false;
    const url = (this.thumbnail.url || '').trim();
    const type = (this.thumbnail.mediaType || '').toLowerCase();
    if (!url) return false;
    return type.startsWith('image') || type.startsWith('video');
  }

  onOpen(): void {
    this.open.emit();
  }

  onLike(event: Event): void {
    event.stopPropagation();
    this.like.emit(event);
  }

  onComment(event: Event): void {
    event.stopPropagation();
    this.comment.emit(event);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(event);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(event);
  }

  getAuthorInitials(): string {
    const raw = (this.authorName || '').trim().replace(/^@/, '');
    if (!raw) return 'U';
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  }
}
