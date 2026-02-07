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

  @Output() open = new EventEmitter<void>();
  @Output() like = new EventEmitter<Event>();
  @Output() comment = new EventEmitter<Event>();
  @Output() edit = new EventEmitter<Event>();
  @Output() delete = new EventEmitter<Event>();

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
}
