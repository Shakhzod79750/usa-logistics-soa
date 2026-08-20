import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_sequence(actors, messages, title, outfile, fig_width=11):
    n = len(actors)
    x_positions = {a[0]: (i + 1) * (fig_width / (n + 1)) for i, a in enumerate(actors)}
    row_height = 0.6
    top_margin = 1.3
    fig_height = top_margin + len(messages) * row_height + 1.0

    fig, ax = plt.subplots(figsize=(fig_width, fig_height))
    ax.set_xlim(0, fig_width)
    ax.set_ylim(0, fig_height)
    ax.axis('off')
    ax.set_title(title, fontsize=14, fontweight='bold', pad=14)

    lifeline_top = fig_height - top_margin
    lifeline_bottom = 0.4

    for aid, label, color in actors:
        x = x_positions[aid]
        box_w, box_h = 1.9, 0.7
        rect = patches.FancyBboxPatch(
            (x - box_w / 2, lifeline_top), box_w, box_h,
            boxstyle="round,pad=0.05,rounding_size=0.08",
            linewidth=1.2, edgecolor=color, facecolor=color, alpha=0.9
        )
        ax.add_patch(rect)
        ax.text(x, lifeline_top + box_h / 2, label, ha='center', va='center',
                 fontsize=9.5, color='white', fontweight='bold', wrap=True)
        ax.plot([x, x], [lifeline_bottom, lifeline_top], color='#888888', linewidth=1.2, linestyle=(0, (4, 3)))

    y = lifeline_top - 0.35
    for msg in messages:
        x_from = x_positions[msg['from']]
        x_to = x_positions[msg['to']]
        style = msg.get('style', 'solid')
        linestyle = '-' if style == 'solid' else '--'
        color = msg.get('color', '#222222')

        if x_from == x_to:
            ax.annotate('', xy=(x_from + 0.55, y - 0.22), xytext=(x_from, y),
                        arrowprops=dict(arrowstyle='-', color=color, linewidth=1.3, linestyle=linestyle))
            ax.annotate('', xy=(x_from, y - 0.22), xytext=(x_from + 0.55, y - 0.22),
                        arrowprops=dict(arrowstyle='->', color=color, linewidth=1.3, linestyle=linestyle))
            ax.text(x_from + 0.65, y - 0.11, msg['label'], fontsize=8.3, va='center', ha='left', color=color)
        else:
            ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                        arrowprops=dict(arrowstyle='->', color=color, linewidth=1.4, linestyle=linestyle,
                                         shrinkA=2, shrinkB=2))
            mid_x = (x_from + x_to) / 2
            ax.text(mid_x, y + 0.11, msg['label'], fontsize=8.3, va='bottom', ha='center', color=color)

        y -= row_height

    plt.tight_layout()
    plt.savefig(outfile, dpi=170, bbox_inches='tight')
    plt.close()
    print(f'rendered {outfile}')
